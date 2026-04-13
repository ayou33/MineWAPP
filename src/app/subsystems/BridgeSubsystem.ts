/**
 * BridgeSubsystem — Hybrid JSBridge for WebView environments.
 *
 * Responsibilities:
 *  - Auto-detect whether a native bridge is present (iOS WKWebView / Android).
 *  - `call<T>(method, params)` — Promise-based outbound RPC to native.
 *  - `on(method, handler)` — Register handlers for native-initiated pushes.
 *  - Expose `isAvailable` for conditional hybrid-only code paths.
 *
 * Wire protocol (JSON over postMessage):
 *  Outbound:  { method, params, callId }
 *  Inbound (reply to call):    { callId, result?, error? }
 *  Inbound (native push):      { method, data }
 *
 * Native side must call `window.__bridgeReceive(jsonString)` to deliver
 * messages back to the web layer.
 */
import type { IAppSubsystem } from './types'

type PendingCall = { resolve(v: unknown): void; reject(e: unknown): void }

export class BridgeSubsystem implements IAppSubsystem {
  readonly name = 'bridge'

  private _available = false
  private readonly _pending = new Map<string, PendingCall>()
  private readonly _listeners = new Map<string, Set<(data: unknown) => void>>()

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  init (): void {
    this._available = this._detect()
    if (this._available) {
      this._setupReceiver()
    }
  }

  dispose (): void {
    delete (window as unknown as Record<string, unknown>)['__bridgeReceive']
    this._pending.clear()
    this._listeners.clear()
    this._available = false
  }

  // ─── Status ────────────────────────────────────────────────────────────────

  /** `true` when a native bridge is detected at init time. */
  get isAvailable (): boolean {
    return this._available
  }

  // ─── Outbound: web → native ────────────────────────────────────────────────

  /**
   * Call a native method and await its response.
   * Rejects immediately when no bridge is available.
   */
  call<T = unknown> (method: string, params?: Record<string, unknown>): Promise<T> {
    if (!this._available) {
      return Promise.reject(new Error('[Bridge] No native bridge detected'))
    }

    return new Promise<T>((resolve, reject) => {
      const callId = `${method}__${Date.now()}__${Math.random().toString(36).slice(2)}`
      this._pending.set(callId, {
        resolve: resolve as (v: unknown) => void,
        reject,
      })
      this._post({ method, params, callId })
    })
  }

  // ─── Inbound: native → web ─────────────────────────────────────────────────

  /**
   * Subscribe to a native-initiated event / push message.
   * Returns an unsubscribe function.
   */
  on<T = unknown> (method: string, handler: (data: T) => void): () => void {
    if (!this._listeners.has(method)) {
      this._listeners.set(method, new Set())
    }
    const typed = handler as (data: unknown) => void
    this._listeners.get(method)!.add(typed)
    return () => this._listeners.get(method)?.delete(typed)
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  private _detect (): boolean {
    const w = window as unknown as Record<string, unknown>
    // iOS WKWebView
    const iosHandler = (w['webkit'] as Record<string, unknown> | undefined)?.['messageHandlers']
    if (iosHandler && typeof (iosHandler as Record<string, unknown>)['bridge'] !== 'undefined') {
      return true
    }
    // Android WebView or custom bridge
    if (typeof w['__bridge'] !== 'undefined') return true
    return false
  }

  private _post (message: unknown): void {
    const json = JSON.stringify(message)
    const w = window as unknown as Record<string, unknown>
    const ios = (w['webkit'] as Record<string, unknown> | undefined)?.['messageHandlers'] as
      Record<string, { postMessage(s: string): void }> | undefined
    if (ios?.['bridge']) {
      ios['bridge'].postMessage(json)
    } else if (w['__bridge'] && typeof (w['__bridge'] as Record<string, unknown>)['postMessage'] === 'function') {
      (w['__bridge'] as { postMessage(s: string): void }).postMessage(json)
    }
  }

  private _setupReceiver (): void {
    (window as unknown as Record<string, unknown>)['__bridgeReceive'] = (json: string) => {
      try {
        const data = JSON.parse(json) as Record<string, unknown>
        if (data['callId']) {
          // Response to a call we made
          const pending = this._pending.get(data['callId'] as string)
          if (pending) {
            this._pending.delete(data['callId'] as string)
            if (data['error']) pending.reject(data['error'])
            else pending.resolve(data['result'])
          }
        } else if (data['method']) {
          // Native-initiated push
          this._listeners
            .get(data['method'] as string)
            ?.forEach(h => h(data['data']))
        }
      } catch {
        // Ignore malformed messages from native
      }
    }
  }
}
