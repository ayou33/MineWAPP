// MineWAPPBridge.kt
// Android integration for MineWAPP JSBridge (Kotlin / WebView)
//
// ─── Requirements ────────────────────────────────────────────────────────────
//  - API 19+ (JavascriptInterface)
//  - WebView with JavaScript enabled
//
// ─── Setup ───────────────────────────────────────────────────────────────────
// 1. Enable JavaScript and add the bridge before loading any URL:
//
//    val bridge = MineWAPPBridge(appVersion = "2.3.1", bridgeVersion = "1.0.0")
//    bridge.configure(webView)
//    webView.loadUrl("https://your.app/")
//
// 2. Register native method handlers (see `on`).
//
// ─── Thread safety ───────────────────────────────────────────────────────────
//  @JavascriptInterface methods are called on a background thread.
//  All WebView interactions (evaluateJavascript, addJavascriptInterface) must
//  happen on the main thread — use mainHandler.post { … }.
// ─────────────────────────────────────────────────────────────────────────────

package com.minewapp.bridge

import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject
import java.security.SecureRandom
import java.util.Base64

typealias BridgeHandler = (params: JSONObject, reply: (result: Any?, error: String?) -> Unit) -> Unit

class MineWAPPBridge(
    private val appVersion: String,
    private val bridgeVersion: String = "1.0.0"
) {
    // ─── Configuration ───────────────────────────────────────────────────────

    /** Window property JS uses for the handshake — matches `new BridgeSubsystem('bridge', 'init')`. */
    private val detectRoot   = "bridge"
    private val detectMethod = "init"

    // ─── Runtime state ───────────────────────────────────────────────────────

    private val mainHandler = Handler(Looper.getMainLooper())
    private var webView: WebView? = null
    private var connection: BridgeConnection? = null
    private val handlers = mutableMapOf<String, BridgeHandler>()

    private data class BridgeConnection(
        val root: String,
        val callName: String,
        val listenName: String,
        val token: String
    )

    // ─── Public API ──────────────────────────────────────────────────────────

    /** Call before `webView.loadUrl(…)`. Injects the handshake shim and attaches the interface. */
    fun configure(webView: WebView) {
        this.webView = webView
        webView.settings.javaScriptEnabled = true

        // Attach __NativeBridge__ for the handshake shim injected below
        webView.addJavascriptInterface(this, "__NativeBridge__")

        // Inject the shim that wraps the synchronous @JavascriptInterface as a Promise
        val shim = """
            (function() {
                if (!window['$detectRoot']) window['$detectRoot'] = {};
                window['$detectRoot']['$detectMethod'] = function(params) {
                    try {
                        var json = __NativeBridge__.handshake(params.url || '', params.ua || '');
                        return Promise.resolve(JSON.parse(json));
                    } catch(e) {
                        return Promise.reject(e);
                    }
                };
            })();
        """.trimIndent()

        // evaluateJavascript requires the WebView to have loaded at least one page.
        // We inject via onPageFinished instead (see WebViewClient helper below), but
        // also provide a convenience method to call manually if needed.
        pendingShim = shim
    }

    /** Register a handler for a named JS→Native method. */
    fun on(method: String, handler: BridgeHandler) {
        handlers[method] = handler
    }

    /** Push a success message to JS listeners registered with `bridge.on(method, handler)`. */
    fun push(method: String, data: Any, code: Int = 0) {
        val conn = connection ?: return
        val msg = JSONObject()
            .put("c", code)
            .put("d", data)
            .put("method", method)
        deliver(msg, conn)
    }

    /**
     * Call from your WebViewClient.onPageFinished to inject the handshake shim.
     *
     * Example:
     * ```
     * webView.webViewClient = object : WebViewClient() {
     *     override fun onPageFinished(view: WebView, url: String) {
     *         bridge.onPageFinished()
     *     }
     * }
     * ```
     */
    fun onPageFinished() {
        val shim = pendingShim ?: return
        evaluateJs(shim)
        pendingShim = null
    }

    // ─── JavascriptInterface — Handshake ─────────────────────────────────────

    /**
     * Synchronous handshake invoked by the JS shim.
     * Returns JSON string with connection info, or an empty string on failure.
     *
     * This runs on a JavascriptInterface background thread.
     */
    @JavascriptInterface
    fun handshake(url: String, ua: String): String {
        val root       = "mwapp"
        val callName   = "call"
        val listenName = "receive"
        val token      = generateToken()

        val conn = BridgeConnection(root, callName, listenName, token)
        connection = conn

        // Inject the outbound call interface on the main thread
        mainHandler.post { injectCallInterface(conn) }

        return JSONObject()
            .put("root",          root)
            .put("callName",      callName)
            .put("listenName",    listenName)
            .put("token",         token)
            .put("appVersion",    appVersion)
            .put("bridgeVersion", bridgeVersion)
            .toString()
    }

    // ─── JavascriptInterface — Outbound calls ─────────────────────────────────

    /**
     * Receives outbound calls from JS: `window[root][callName](payloadJson)`.
     * This runs on a JavascriptInterface background thread.
     */
    @JavascriptInterface
    fun call(payloadJson: String) {
        val payload = runCatching { JSONObject(payloadJson) }.getOrNull() ?: return
        val method  = payload.optString("method")
        val params  = payload.optJSONObject("params") ?: JSONObject()
        val token   = payload.optString("token")
        val callId  = payload.optString("callId").takeIf { it.isNotEmpty() }

        val conn = connection
        if (conn == null || conn.token != token) {
            callId?.let { id ->
                deliver(JSONObject().put("c", 403).put("d", "Unauthorized").put("callId", id), conn ?: return)
            }
            return
        }

        val handler = handlers[method]
        if (handler == null) {
            callId?.let { id ->
                deliver(JSONObject().put("c", 404).put("d", "Unknown method: $method").put("callId", id), conn)
            }
            return
        }

        handler(params) { result, error ->
            callId ?: return@handler
            val msg = if (error != null) {
                JSONObject().put("c", 1).put("d", error).put("callId", callId)
            } else {
                JSONObject().put("c", 0).put("d", result ?: JSONObject.NULL).put("callId", callId)
            }
            deliver(msg, conn)
        }
    }

    // ─── Internals ───────────────────────────────────────────────────────────

    private var pendingShim: String? = null

    private fun generateToken(): String {
        val bytes = ByteArray(24)
        SecureRandom().nextBytes(bytes)
        return Base64.getEncoder().encodeToString(bytes)
    }

    private fun injectCallInterface(conn: BridgeConnection) {
        // Attach the bridge call interface so JS can invoke it
        webView?.addJavascriptInterface(this, "__NativeBridgeCall__")

        val js = """
            (function() {
                if (!window['${conn.root}']) window['${conn.root}'] = {};
                window['${conn.root}']['${conn.callName}'] = function(payload) {
                    __NativeBridgeCall__.call(JSON.stringify(payload));
                };
            })();
        """.trimIndent()
        evaluateJs(js)
    }

    private fun deliver(message: JSONObject, conn: BridgeConnection) {
        val json = message.toString()
            .replace("\\", "\\\\")
            .replace("'", "\\'")
        val js = "window['${conn.root}']['${conn.listenName}']('$json');"
        evaluateJs(js)
    }

    private fun evaluateJs(js: String) {
        mainHandler.post {
            webView?.evaluateJavascript(js, null)
        }
    }
}
