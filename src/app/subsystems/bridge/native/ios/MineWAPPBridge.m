// MineWAPPBridge.m
// iOS integration for MineWAPP JSBridge (Objective-C / WKWebView)

#import "MineWAPPBridge.h"
#import <Security/Security.h>

@interface MineWAPPBridge ()

@property (nonatomic, strong) NSString *appVersion;
@property (nonatomic, strong) NSString *bridgeVersion;
@property (nonatomic, strong, nullable) NSDictionary *connection; // { root, callName, listenName, token }
@property (nonatomic, strong) NSMutableDictionary<NSString *, MineWAPPBridgeHandler> *handlers;

@end

@implementation MineWAPPBridge

static NSString * const kDetectRoot   = @"bridge";
static NSString * const kDetectMethod = @"init";
static NSString * const kCallHandler  = @"__bridgeCall";

// MARK: - Init

- (instancetype)initWithAppVersion:(NSString *)appVersion
                     bridgeVersion:(NSString *)bridgeVersion {
    if (self = [super init]) {
        _appVersion    = appVersion;
        _bridgeVersion = bridgeVersion;
        _handlers      = [NSMutableDictionary dictionary];
    }
    return self;
}

// MARK: - Public

- (void)configureWithConfiguration:(WKWebViewConfiguration *)configuration {
    [configuration.userContentController addScriptMessageHandler:self
                                                    contentWorld:WKContentWorld.pageWorld
                                                            name:kDetectMethod];

    NSString *shim = [NSString stringWithFormat:
        @"(function(){"
         "if(!window['%@'])window['%@']={};"
         "window['%@']['%@']=function(p){"
         "  return new Promise(function(res,rej){"
         "    window.webkit.messageHandlers['%@']"
         "      .postMessage(p)"
         "      .then(function(j){res(JSON.parse(j));})"
         "      .catch(rej);"
         "  });"
         "};"
         "})();",
        kDetectRoot, kDetectRoot, kDetectRoot, kDetectMethod, kDetectMethod];

    WKUserScript *script = [[WKUserScript alloc]
        initWithSource:shim
         injectionTime:WKUserScriptInjectionTimeAtDocumentStart
      forMainFrameOnly:YES];
    [configuration.userContentController addUserScript:script];
}

- (void)onMethod:(NSString *)method handler:(MineWAPPBridgeHandler)handler {
    self.handlers[method] = handler;
}

- (void)pushMethod:(NSString *)method data:(id)data {
    [self pushMethod:method data:data code:0];
}

- (void)pushMethod:(NSString *)method data:(id)data code:(NSInteger)code {
    if (!self.connection) return;
    NSDictionary *message = @{ @"c": @(code), @"d": data, @"method": method };
    [self deliverMessage:message];
}

// MARK: - WKScriptMessageHandlerWithReply (handshake)

- (void)userContentController:(WKUserContentController *)userContentController
             didReceiveScriptMessage:(WKScriptMessage *)message
                        replyHandler:(void (^)(id _Nullable, NSString * _Nullable))replyHandler {
    if (![message.name isEqualToString:kDetectMethod]) return;

    NSString *root        = @"mwapp";
    NSString *callName    = @"call";
    NSString *listenName  = @"receive";
    NSString *token       = [self generateToken];

    self.connection = @{
        @"root"       : root,
        @"callName"   : callName,
        @"listenName" : listenName,
        @"token"      : token,
    };

    [self injectCallInterfaceWithRoot:root callName:callName];

    NSDictionary *response = @{
        @"root"          : root,
        @"callName"      : callName,
        @"listenName"    : listenName,
        @"token"         : token,
        @"appVersion"    : self.appVersion,
        @"bridgeVersion" : self.bridgeVersion,
    };
    NSData *data = [NSJSONSerialization dataWithJSONObject:response options:0 error:nil];
    NSString *json = data ? [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] : nil;
    if (json) {
        replyHandler(json, nil);
    } else {
        replyHandler(nil, @"Serialization failed");
    }
}

// MARK: - WKScriptMessageHandler (outbound calls)

- (void)userContentController:(WKUserContentController *)userContentController
      didReceiveScriptMessage:(WKScriptMessage *)message {
    if (![message.name isEqualToString:kCallHandler]) return;

    NSString *jsonString = message.body;
    NSData *data = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
    if (!data) return;
    NSDictionary *payload = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
    if (!payload) return;

    NSString *method = payload[@"method"] ?: @"";
    NSDictionary *params = payload[@"params"] ?: @{};
    NSString *token  = payload[@"token"]  ?: @"";
    NSString *callId = payload[@"callId"];

    [self handleMethod:method params:params token:token callId:callId];
}

// MARK: - Internals

- (NSString *)generateToken {
    uint8_t bytes[24];
    SecRandomCopyBytes(kSecRandomDefault, sizeof(bytes), bytes);
    NSData *data = [NSData dataWithBytes:bytes length:sizeof(bytes)];
    return [data base64EncodedStringWithOptions:0];
}

- (void)injectCallInterfaceWithRoot:(NSString *)root callName:(NSString *)callName {
    NSString *js = [NSString stringWithFormat:
        @"(function(){"
         "if(!window['%@'])window['%@']={};"
         "window['%@']['%@']=function(p){"
         "  window.webkit.messageHandlers['%@'].postMessage(JSON.stringify(p));"
         "};"
         "})();",
        root, root, root, callName, kCallHandler];

    dispatch_async(dispatch_get_main_queue(), ^{
        [self.webView evaluateJavaScript:js completionHandler:nil];
    });

    [self.webView.configuration.userContentController removeScriptMessageHandlerForName:kCallHandler];
    [self.webView.configuration.userContentController addScriptMessageHandler:self name:kCallHandler];
}

- (void)handleMethod:(NSString *)method
              params:(NSDictionary *)params
               token:(NSString *)token
              callId:(nullable NSString *)callId {
    if (!self.connection || ![self.connection[@"token"] isEqualToString:token]) {
        if (callId) {
            [self deliverMessage:@{ @"c": @403, @"d": @"Unauthorized", @"callId": callId }];
        }
        return;
    }

    MineWAPPBridgeHandler handler = self.handlers[method];
    if (!handler) {
        if (callId) {
            [self deliverMessage:@{ @"c": @404, @"d": [NSString stringWithFormat:@"Unknown method: %@", method], @"callId": callId }];
        }
        return;
    }

    __weak typeof(self) weakSelf = self;
    handler(params, ^(id result, NSError *error) {
        if (!callId) return;
        NSDictionary *msg;
        if (error) {
            msg = @{ @"c": @1, @"d": error.localizedDescription, @"callId": callId };
        } else {
            msg = @{ @"c": @0, @"d": result ?: [NSNull null], @"callId": callId };
        }
        [weakSelf deliverMessage:msg];
    });
}

- (void)deliverMessage:(NSDictionary *)message {
    NSData *data = [NSJSONSerialization dataWithJSONObject:message options:0 error:nil];
    if (!data) return;
    NSString *json = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    if (!json) return;

    // Escape for single-quoted JS string context
    json = [json stringByReplacingOccurrencesOfString:@"\\" withString:@"\\\\"];
    json = [json stringByReplacingOccurrencesOfString:@"'"  withString:@"\\'"];

    NSString *root       = self.connection[@"root"];
    NSString *listenName = self.connection[@"listenName"];
    NSString *js = [NSString stringWithFormat:@"window['%@']['%@']('%@');", root, listenName, json];

    dispatch_async(dispatch_get_main_queue(), ^{
        [self.webView evaluateJavaScript:js completionHandler:nil];
    });
}

@end
