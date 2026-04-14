// MineWAPPBridge.h
// iOS integration for MineWAPP JSBridge (Objective-C / WKWebView)
//
// Minimum deployment target: iOS 14.0 (requires WKScriptMessageHandlerWithReply).
//
// ─── Setup ───────────────────────────────────────────────────────────────────
// 1. Add MineWAPPBridge to your WKWebViewConfiguration before creating the WKWebView:
//
//    MineWAPPBridge *bridge = [[MineWAPPBridge alloc] initWithAppVersion:@"2.3.1"
//                                                          bridgeVersion:@"1.0.0"];
//    [bridge configureWithConfiguration:config];
//    self.webView = [[WKWebView alloc] initWithFrame:CGRectZero configuration:config];
//    bridge.webView = self.webView;
//
// 2. Register handlers (see MineWAPPBridge.m for example).
// ─────────────────────────────────────────────────────────────────────────────

#import <WebKit/WebKit.h>

NS_ASSUME_NONNULL_BEGIN

typedef void(^MineWAPPBridgeReply)(id _Nullable result, NSError * _Nullable error);
typedef void(^MineWAPPBridgeHandler)(NSDictionary *params, MineWAPPBridgeReply reply);

@interface MineWAPPBridge : NSObject <WKScriptMessageHandlerWithReply, WKScriptMessageHandler>

/// Host app version string delivered to JS during handshake.
@property (nonatomic, readonly) NSString *appVersion;
/// Bridge protocol version string delivered to JS during handshake.
@property (nonatomic, readonly) NSString *bridgeVersion;
/// The WKWebView this bridge is attached to.  Assign after creating the WKWebView.
@property (nonatomic, weak, nullable) WKWebView *webView;

- (instancetype)initWithAppVersion:(NSString *)appVersion
                     bridgeVersion:(NSString *)bridgeVersion NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;

/// Call before creating WKWebView.  Injects the handshake shim and registers handlers.
- (void)configureWithConfiguration:(WKWebViewConfiguration *)configuration;

/// Register a handler for a named JS→Native method.
- (void)onMethod:(NSString *)method handler:(MineWAPPBridgeHandler)handler;

/// Push a message to JS listeners registered with `bridge.on(method, handler)`.
- (void)pushMethod:(NSString *)method data:(id)data;
/// Push a failure message to JS listeners.
- (void)pushMethod:(NSString *)method data:(id)data code:(NSInteger)code;

@end

NS_ASSUME_NONNULL_END
