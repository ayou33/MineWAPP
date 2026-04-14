// MineWAPPBridge.swift
// iOS integration for MineWAPP JSBridge (Swift / WKWebView)
//
// Minimum deployment target: iOS 14.0 (requires WKScriptMessageHandlerWithReply).
//
// ─── Setup ───────────────────────────────────────────────────────────────────
// 1. Add MineWAPPBridge to your WKWebViewConfiguration before creating the WKWebView:
//
//    let bridge = MineWAPPBridge(appVersion: "2.3.1", bridgeVersion: "1.0.0")
//    bridge.configure(configuration: config)
//    let webView = WKWebView(frame: .zero, configuration: config)
//    bridge.webView = webView
//
// 2. Implement native method handlers (see `handleNativeCall`).
// ─────────────────────────────────────────────────────────────────────────────

import WebKit
import CryptoKit

/// Singleton bridge coordinating JS↔Native communication over WKWebView.
public final class MineWAPPBridge: NSObject {

    // MARK: - Configuration

    /// Host app version string delivered to JS during handshake.
    public let appVersion: String
    /// Bridge protocol version string delivered to JS during handshake.
    public let bridgeVersion: String

    /// The initial window property JS uses to trigger the handshake.
    /// Must match `new BridgeSubsystem('<detectRoot>', '<detectMethod>')` in JS.
    private let detectRoot = "bridge"
    private let detectMethod = "init"

    // MARK: - Runtime state

    /// The WKWebView this bridge is attached to. Assign after creating the WKWebView.
    public weak var webView: WKWebView?

    /// Established connection info (set during handshake).
    private var connection: BridgeConnection?

    /// Registered method handlers: method name → closure.
    private var handlers: [String: ([String: Any], @escaping (Any?, Error?) -> Void) -> Void] = [:]

    // MARK: - Init

    public init(appVersion: String, bridgeVersion: String = "1.0.0") {
        self.appVersion = appVersion
        self.bridgeVersion = bridgeVersion
    }

    // MARK: - Public API

    /// Call this before creating WKWebView.  Injects the handshake shim and registers handlers.
    public func configure(configuration: WKWebViewConfiguration) {
        let userContentController = configuration.userContentController

        // Register async handshake handler (iOS 14+)
        userContentController.addScriptMessageHandler(self, contentWorld: .page, name: detectMethod)

        // Inject a shim that exposes `window.bridge.init(...)` before page JS runs.
        let shim = """
        (function() {
            if (!window['\(detectRoot)']) window['\(detectRoot)'] = {};
            window['\(detectRoot)']['\(detectMethod)'] = function(params) {
                return new Promise(function(resolve, reject) {
                    window.webkit.messageHandlers['\(detectMethod)']
                        .postMessage(params)
                        .then(function(json) { resolve(JSON.parse(json)); })
                        .catch(reject);
                });
            };
        })();
        """
        let script = WKUserScript(source: shim, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        userContentController.addUserScript(script)
    }

    /// Register a handler for a named JS→Native method.
    ///
    /// - Parameters:
    ///   - method: The method name JS passes in `call(method, params)`.
    ///   - handler: Invoked with the decoded params dictionary.
    ///              Call `reply(result, nil)` to resolve, or `reply(nil, error)` to reject.
    public func on(
        method: String,
        handler: @escaping ([String: Any], @escaping (Any?, Error?) -> Void) -> Void
    ) {
        handlers[method] = handler
    }

    /// Push a message to JS listeners registered with `bridge.on(method, handler)`.
    public func push(method: String, data: Any, code: Int = 0) {
        guard let conn = connection else { return }
        let message: [String: Any] = ["c": code, "d": data, "method": method]
        deliver(message, via: conn)
    }

    // MARK: - Internals

    private struct BridgeConnection {
        let root: String
        let callName: String
        let listenName: String
        let token: String
    }

    private func generateToken() -> String {
        var bytes = [UInt8](repeating: 0, count: 24)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        return Data(bytes).base64EncodedString()
    }

    private func injectCallInterface(_ conn: BridgeConnection) {
        let js = """
        (function() {
            if (!window['\(conn.root)']) window['\(conn.root)'] = {};
            window['\(conn.root)']['\(conn.callName)'] = function(payload) {
                window.webkit.messageHandlers['__bridgeCall'].postMessage(JSON.stringify(payload));
            };
        })();
        """
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js)
        }

        // Register the outbound call handler if not already done
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "__bridgeCall")
        webView?.configuration.userContentController.add(self, name: "__bridgeCall")
    }

    private func deliver(_ message: [String: Any], via conn: BridgeConnection) {
        guard let data = try? JSONSerialization.data(withJSONObject: message),
              var json = String(data: data, encoding: .utf8) else { return }
        // Escape for single-quoted JS string context
        json = json.replacingOccurrences(of: "\\", with: "\\\\")
                   .replacingOccurrences(of: "'", with: "\\'")
        let js = "window['\(conn.root)']['\(conn.listenName)']('\(json)');"
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js)
        }
    }

    private func handleNativeCall(method: String, params: [String: Any], token: String, callId: String?) {
        guard let conn = connection, conn.token == token else {
            // Invalid token — respond with 403
            if let id = callId {
                let reply: [String: Any] = ["c": 403, "d": "Unauthorized", "callId": id]
                deliver(reply, via: conn ?? connection!)
            }
            return
        }

        let handler = handlers[method]
        let replyBlock: (Any?, Error?) -> Void = { [weak self] result, error in
            guard let self, let id = callId else { return }
            let msg: [String: Any]
            if let error = error {
                msg = ["c": 1, "d": error.localizedDescription, "callId": id]
            } else {
                msg = ["c": 0, "d": result ?? NSNull(), "callId": id]
            }
            self.deliver(msg, via: conn)
        }

        if let handler = handler {
            handler(params, replyBlock)
        } else {
            replyBlock(nil, NSError(domain: "MineWAPPBridge", code: 404,
                                   userInfo: [NSLocalizedDescriptionKey: "Unknown method: \(method)"]))
        }
    }
}

// MARK: - WKScriptMessageHandlerWithReply (handshake)

extension MineWAPPBridge: WKScriptMessageHandlerWithReply {

    public func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage,
        replyHandler: @escaping (Any?, String?) -> Void
    ) {
        guard message.name == detectMethod else { return }

        let root = "mwapp"
        let callName = "call"
        let listenName = "receive"
        let token = generateToken()

        let conn = BridgeConnection(root: root, callName: callName, listenName: listenName, token: token)
        self.connection = conn

        injectCallInterface(conn)

        let response: [String: Any] = [
            "root": root,
            "callName": callName,
            "listenName": listenName,
            "token": token,
            "appVersion": appVersion,
            "bridgeVersion": bridgeVersion,
        ]
        if let data = try? JSONSerialization.data(withJSONObject: response),
           let json = String(data: data, encoding: .utf8) {
            replyHandler(json, nil)
        } else {
            replyHandler(nil, "Serialization failed")
        }
    }
}

// MARK: - WKScriptMessageHandler (outbound calls after handshake)

extension MineWAPPBridge: WKScriptMessageHandler {

    public func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "__bridgeCall",
              let jsonString = message.body as? String,
              let data = jsonString.data(using: .utf8),
              let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return }

        let method = payload["method"] as? String ?? ""
        let params = payload["params"] as? [String: Any] ?? [:]
        let token  = payload["token"]  as? String ?? ""
        let callId = payload["callId"] as? String

        handleNativeCall(method: method, params: params, token: token, callId: callId)
    }
}
