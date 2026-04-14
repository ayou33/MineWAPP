/**
 * BridgeSubsystem — Hybrid JSBridge for WebView environments.
 *
 * Responsibilities:
 *  - Handshake with a native bridge via a user-specified window method to
 *    detect and establish the hybrid connection.
 *  - `call<T>(method, params)` — Promise-based outbound RPC to native.
 *  - `on(method, handler)` — Register handlers for native-initiated pushes.
 *  - Expose `isAvailable` for conditional hybrid-only code paths.
 *
 * Handshake protocol:
 *  1. At init, call `window[detectRoot]?.[detectMethod]?.({ url, ua })`.
 *  2. If the call returns `{ root, callName, listenName, token, appVersion, bridgeVersion }`,
 *     the bridge is available.
 *     - Outbound calls go to `window[root][callName]({ token, ...payload })`.
 *     - Inbound messages arrive via `window[root][listenName](jsonString)`.
 *
 * Inbound message shapes (all wrapped in `{ c, d }`):
 *  c = 0 → success, c ≠ 0 → failure.  d carries the payload.
 *
 *  Reply to a `call()`:    { c, d, callId }   — callId routes to the pending promise
 *  Native-initiated push:  { c, d, method }   — method routes to registered listeners
 */
import type { AppBase, IAppSubsystem } from '../types'

type PendingCall = { resolve(v: unknown): void; reject(e: unknown): void }

/** Envelope for every inbound message from native. */
type BridgeMessage = {
  /** 0 = success; any other value = failure. */
  c: number
  /** Payload — result data on success, error info on failure. */
  d: unknown
  /** Present on RPC replies — routes the message to the matching pending call. */
  callId?: string
  /** Present on native-initiated pushes — routes to registered `on()` listeners. */
  method?: string
}

type BridgeConnection = {
  /** Window property key for the established communication channel. */
  root: string
  /** Method name to invoke on the root object for each outbound call. */
  callName: string
  /** Method name native will invoke on the root object to deliver inbound messages. */
  listenName: string
  /** Session token included in every outbound payload. */
  token: string
  /** Host app version string, e.g. `'2.3.1'`. */
  appVersion: string
  /** Bridge protocol version string. */
  bridgeVersion: string
}

export class BridgeSubsystem implements IAppSubsystem {
  readonly name = 'bridge'

  private _available = false
  private _connection: BridgeConnection | null = null
  private readonly _detectRoot: string
  private readonly _detectMethod: string
  private readonly _pending = new Map<string, PendingCall>()
  private readonly _listeners = new Map<string, Set<(data: unknown) => void>>()

  /**
   * @param detectRoot   - Window property name that hosts the bridge object
   *                       used for the initial handshake, e.g. `'bridge'`.
   * @param detectMethod - Method name on that object to call for handshake,
   *                       e.g. `'init'`.
   *
   * @example
   * ```ts
   * new BridgeSubsystem('bridge', 'init')
   * // calls: window.bridge?.init?.({ url, ua })
   * ```
   */
  constructor (detectRoot: string, detectMethod: string) {
    this._detectRoot = detectRoot
    this._detectMethod = detectMethod
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async init (app: AppBase): Promise<void> {
    const w = window as unknown as Record<string, unknown>
    const rootObj = w[this._detectRoot] as Record<string, unknown> | undefined
    if (!rootObj) return

    const fn = rootObj[this._detectMethod] as
      | ((params: { url: string; ua: string }) => unknown)
      | undefined
    if (typeof fn !== 'function') return

    try {
      const result = await fn({ url: app.launchUrl, ua: app.ua }) as BridgeConnection | null | undefined
      if (result?.root && result?.callName && result?.listenName && result?.token) {
        this._connection = {
          root: result.root,
          callName: result.callName,
          listenName: result.listenName,
          token: result.token,
          appVersion: result.appVersion ?? '',
          bridgeVersion: result.bridgeVersion ?? '',
        }
        this._available = true
        this._setupReceiver()
      }
    } catch {
      // Handshake failed — treat as non-hybrid environment.
    }
  }

  dispose (): void {
    if (this._connection) {
      const w = window as unknown as Record<string, unknown>
      const rootObj = w[this._connection.root] as Record<string, unknown> | undefined
      if (rootObj) delete rootObj[this._connection.listenName]
    }
    this._pending.clear()
    this._listeners.clear()
    this._available = false
    this._connection = null
  }

  // ─── Status ────────────────────────────────────────────────────────────────

  /** `true` when the native handshake succeeded at init time. */
  get isAvailable (): boolean {
    return this._available
  }

  /** Host app version string from the handshake, or empty string when unavailable. */
  get appVersion (): string {
    return this._connection?.appVersion ?? ''
  }

  /** Bridge protocol version string from the handshake, or empty string when unavailable. */
  get bridgeVersion (): string {
    return this._connection?.bridgeVersion ?? ''
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

  private _post (message: unknown): void {
    if (!this._connection) return
    const w = window as unknown as Record<string, unknown>
    const rootObj = w[this._connection.root] as Record<string, unknown> | undefined
    const fn = rootObj?.[this._connection.callName] as ((msg: unknown) => void) | undefined
    if (typeof fn === 'function') {
      fn({ ...(message as object), token: this._connection.token })
    }
  }

  private _setupReceiver (): void {
    if (!this._connection) return
    const w = window as unknown as Record<string, unknown>
    // Ensure the root object exists on window before attaching the listener.
    if (!w[this._connection.root]) w[this._connection.root] = {}
    const rootObj = w[this._connection.root] as Record<string, unknown>
    rootObj[this._connection.listenName] = (json: string) => {
      try {
        const msg = JSON.parse(json) as BridgeMessage
        if (msg.callId) {
          // Response to a call we made
          const pending = this._pending.get(msg.callId)
          if (pending) {
            this._pending.delete(msg.callId)
            if (msg.c === 0) pending.resolve(msg.d)
            else pending.reject(msg.d)
          }
        } else if (msg.method) {
          // Native-initiated push
          this._listeners
            .get(msg.method)
            ?.forEach(h => h(msg.d))
        }
      } catch {
        // Ignore malformed messages from native
      }
    }
  }
}
