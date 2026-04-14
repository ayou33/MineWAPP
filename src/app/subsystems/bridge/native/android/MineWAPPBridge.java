// MineWAPPBridge.java
// Android integration for MineWAPP JSBridge (Java / WebView)
//
// ─── Requirements ────────────────────────────────────────────────────────────
//  - API 19+ (JavascriptInterface)
//  - WebView with JavaScript enabled
//
// ─── Setup ───────────────────────────────────────────────────────────────────
// 1. Enable JavaScript and add the bridge before loading any URL:
//
//    MineWAPPBridge bridge = new MineWAPPBridge("2.3.1", "1.0.0");
//    bridge.configure(webView);
//    webView.loadUrl("https://your.app/");
//
// 2. Register native method handlers (see `on`).
//
// ─── Thread safety ───────────────────────────────────────────────────────────
//  @JavascriptInterface methods are called on a background thread.
//  All WebView interactions must happen on the main thread — use mainHandler.post(…).
// ─────────────────────────────────────────────────────────────────────────────

package com.minewapp.bridge;

import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONException;
import org.json.JSONObject;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

public class MineWAPPBridge {

    // ─── Configuration ───────────────────────────────────────────────────────

    private static final String DETECT_ROOT    = "bridge";
    private static final String DETECT_METHOD  = "init";
    private static final String CALL_INTERFACE = "__NativeBridgeCall__";

    // ─── Fields ──────────────────────────────────────────────────────────────

    private final String appVersion;
    private final String bridgeVersion;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private WebView webView;
    private BridgeConnection connection;
    private String pendingShim;

    private final Map<String, BridgeHandler> handlers = new HashMap<>();

    // ─── Inner types ─────────────────────────────────────────────────────────

    /** Callback invoked when a JS→Native method is triggered. */
    public interface BridgeHandler {
        void handle(JSONObject params, BridgeReply reply);
    }

    /** Reply callback passed to every BridgeHandler. */
    public interface BridgeReply {
        void success(Object result);
        void failure(String error);
    }

    private static class BridgeConnection {
        final String root, callName, listenName, token;
        BridgeConnection(String root, String callName, String listenName, String token) {
            this.root        = root;
            this.callName    = callName;
            this.listenName  = listenName;
            this.token       = token;
        }
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    public MineWAPPBridge(String appVersion, String bridgeVersion) {
        this.appVersion    = appVersion;
        this.bridgeVersion = bridgeVersion;
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    /** Call before `webView.loadUrl(…)`. Injects the handshake shim and attaches the interface. */
    public void configure(WebView webView) {
        this.webView = webView;
        webView.getSettings().setJavaScriptEnabled(true);
        webView.addJavascriptInterface(this, "__NativeBridge__");

        pendingShim =
            "(function() {" +
            "  if (!window['" + DETECT_ROOT + "']) window['" + DETECT_ROOT + "'] = {};" +
            "  window['" + DETECT_ROOT + "']['" + DETECT_METHOD + "'] = function(params) {" +
            "    try {" +
            "      var json = __NativeBridge__.handshake(params.url || '', params.ua || '');" +
            "      return Promise.resolve(JSON.parse(json));" +
            "    } catch(e) { return Promise.reject(e); }" +
            "  };" +
            "})();";
    }

    /** Register a handler for a named JS→Native method. */
    public void on(String method, BridgeHandler handler) {
        handlers.put(method, handler);
    }

    /** Push a success message to JS listeners. */
    public void push(String method, Object data) {
        push(method, data, 0);
    }

    /** Push a message with an explicit code to JS listeners. */
    public void push(String method, Object data, int code) {
        if (connection == null) return;
        try {
            JSONObject msg = new JSONObject()
                .put("c", code)
                .put("d", data)
                .put("method", method);
            deliver(msg, connection);
        } catch (JSONException ignored) {}
    }

    /**
     * Call from your WebViewClient.onPageFinished to inject the handshake shim.
     *
     * Example:
     * <pre>
     * webView.setWebViewClient(new WebViewClient() {
     *     {@literal @}Override
     *     public void onPageFinished(WebView view, String url) {
     *         bridge.onPageFinished();
     *     }
     * });
     * </pre>
     */
    public void onPageFinished() {
        if (pendingShim == null) return;
        evaluateJs(pendingShim);
        pendingShim = null;
    }

    // ─── JavascriptInterface — Handshake ─────────────────────────────────────

    /**
     * Synchronous handshake invoked by the JS shim.
     * Returns a JSON string with the connection info.
     *
     * Called on a background thread by the WebView runtime.
     */
    @JavascriptInterface
    public String handshake(String url, String ua) {
        final String root       = "mwapp";
        final String callName   = "call";
        final String listenName = "receive";
        final String token      = generateToken();

        connection = new BridgeConnection(root, callName, listenName, token);

        final BridgeConnection conn = connection;
        mainHandler.post(() -> injectCallInterface(conn));

        try {
            return new JSONObject()
                .put("root",          root)
                .put("callName",      callName)
                .put("listenName",    listenName)
                .put("token",         token)
                .put("appVersion",    appVersion)
                .put("bridgeVersion", bridgeVersion)
                .toString();
        } catch (JSONException e) {
            return "{}";
        }
    }

    // ─── JavascriptInterface — Outbound calls ─────────────────────────────────

    /**
     * Receives outbound calls from JS.
     * Called on a background thread by the WebView runtime.
     */
    @JavascriptInterface
    public void call(String payloadJson) {
        final JSONObject payload;
        try {
            payload = new JSONObject(payloadJson);
        } catch (JSONException e) {
            return;
        }

        String method  = payload.optString("method");
        JSONObject params = payload.optJSONObject("params");
        if (params == null) params = new JSONObject();
        String token   = payload.optString("token");
        String callIdRaw = payload.optString("callId");
        final String callId = callIdRaw.isEmpty() ? null : callIdRaw;

        final BridgeConnection conn = connection;
        if (conn == null || !conn.token.equals(token)) {
            if (callId != null) {
                try {
                    deliver(new JSONObject().put("c", 403).put("d", "Unauthorized").put("callId", callId), conn);
                } catch (JSONException ignored) {}
            }
            return;
        }

        BridgeHandler handler = handlers.get(method);
        if (handler == null) {
            if (callId != null) {
                try {
                    deliver(new JSONObject().put("c", 404).put("d", "Unknown method: " + method).put("callId", callId), conn);
                } catch (JSONException ignored) {}
            }
            return;
        }

        final JSONObject finalParams = params;
        handler.handle(finalParams, new BridgeReply() {
            @Override
            public void success(Object result) {
                if (callId == null) return;
                try {
                    deliver(new JSONObject().put("c", 0).put("d", result != null ? result : JSONObject.NULL).put("callId", callId), conn);
                } catch (JSONException ignored) {}
            }
            @Override
            public void failure(String error) {
                if (callId == null) return;
                try {
                    deliver(new JSONObject().put("c", 1).put("d", error).put("callId", callId), conn);
                } catch (JSONException ignored) {}
            }
        });
    }

    // ─── Internals ───────────────────────────────────────────────────────────

    private String generateToken() {
        byte[] bytes = new byte[24];
        new SecureRandom().nextBytes(bytes);
        return Base64.getEncoder().encodeToString(bytes);
    }

    private void injectCallInterface(BridgeConnection conn) {
        webView.addJavascriptInterface(this, CALL_INTERFACE);
        String js =
            "(function() {" +
            "  if (!window['" + conn.root + "']) window['" + conn.root + "'] = {};" +
            "  window['" + conn.root + "']['" + conn.callName + "'] = function(payload) {" +
            "    " + CALL_INTERFACE + ".call(JSON.stringify(payload));" +
            "  };" +
            "})();";
        evaluateJs(js);
    }

    private void deliver(JSONObject message, BridgeConnection conn) {
        if (conn == null) return;
        String json = message.toString()
            .replace("\\", "\\\\")
            .replace("'", "\\'");
        String js = "window['" + conn.root + "']['" + conn.listenName + "']('" + json + "');";
        evaluateJs(js);
    }

    private void evaluateJs(String js) {
        mainHandler.post(() -> {
            if (webView != null) {
                webView.evaluateJavascript(js, null);
            }
        });
    }
}
