/**
 * SocketSubsystem — Named WebSocket connection manager.
 *
 * Manages one or more named WebSocket connections, each with:
 *  - Standard events: connect / disconnect / error / aborted / message
 *  - Custom event subscriptions
 *  - Automatic heartbeat (configurable ping/pong)
 *  - Automatic reconnect with exponential back-off
 *  - Offline message queue, flushed after successful reconnect
 *
 * Usage:
 * ```ts
 * // Register the subsystem (no constructor args required)
 * const application = createApplication({
 *   socket: new SocketSubsystem(),
 * })
 *
 * // Add connections at runtime (e.g. after login)
 * application.socket.add('wss://example.com')
 * // → 'main'  (first call, default name)
 *
 * const name = application.socket.add('wss://example.com/other')
 * // → 'ws_abc123'  (random, because 'main' already exists)
 *
 * application.socket.add({ url: 'wss://example.com/trade', name: 'trade' })
 * // → 'trade'
 *
 * // Events
 * application.socket.on('message', (data) => console.log(data))
 * application.socket.on('connect', handler, 'trade')
 * application.socket.off('message', handler)
 *
 * // Send — queued if not yet connected, flushed on open
 * application.socket.send({ type: 'subscribe', channel: 'prices' })
 *
 * // Explicit connect / disconnect
 * application.socket.connect()
 * application.socket.disconnect()
 * ```
 */
import type { IAppSubsystem } from '../types'

// ─── Public types ─────────────────────────────────────────────────────────────

export type SocketHandler = (...args: unknown[]) => void

export enum SocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

export interface HeartbeatOptions {
  /**
   * Ping payload sent at each interval.
   * Default: `'ping'`
   */
  message?: unknown
  /**
   * Interval in ms between ping sends.
   * Default: `30_000` (30 s)
   */
  interval?: number
  /**
   * Time in ms to wait for a pong response before closing the socket.
   * A forced close will trigger the reconnect logic if enabled.
   * Default: `5_000` (5 s)
   */
  timeout?: number
  /**
   * Predicate that identifies an incoming frame as a pong response.
   * The first message that returns `true` resets the pong timer and is
   * NOT forwarded to `'message'` listeners.
   * Default: `() => true` — any incoming message is treated as a pong.
   */
  isPong?: (data: unknown) => boolean
}

export interface ReconnectOptions {
  /**
   * Maximum number of reconnect attempts.
   * `0` means unlimited.
   * Default: `0`
   */
  maxAttempts?: number
  /**
   * Base delay in ms before the first reconnect attempt.
   * Default: `1_000` (1 s)
   */
  delay?: number
  /**
   * Upper cap on reconnect delay.
   * Default: `30_000` (30 s)
   */
  maxDelay?: number
  /**
   * Exponential backoff multiplier applied to `delay` on each failed attempt.
   * Default: `1.5`
   */
  backoff?: number
}

export interface SocketOptions {
  /** WebSocket URL, e.g. `'wss://example.com/ws'` */
  url: string
  /** Optional sub-protocols forwarded to the WebSocket constructor. */
  protocols?: string | string[]
  /**
   * Heartbeat configuration.
   * Set to `false` to disable.
   * Omit to use defaults (30 s interval, 5 s pong timeout).
   */
  heartbeat?: HeartbeatOptions | false
  /**
   * Reconnect configuration.
   * Set to `false` to disable.
   * Omit to use defaults (exponential back-off, unlimited attempts).
   */
  reconnect?: ReconnectOptions | false
  /**
   * Instance name.
   * Default: `'main'`.
   * If omitted and `'main'` is already registered, the subsystem
   * auto-generates a random name and returns it from `add()`.
   */
  name?: string
}

// ─── Internal defaults ────────────────────────────────────────────────────────

type ResolvedHeartbeat = Required<HeartbeatOptions>
type ResolvedReconnect = Required<ReconnectOptions>

const DEFAULT_HEARTBEAT: ResolvedHeartbeat = {
  message: 'ping',
  interval: 30_000,
  timeout: 5_000,
  isPong: () => true,
}

const DEFAULT_RECONNECT: ResolvedReconnect = {
  maxAttempts: 0,
  delay: 1_000,
  maxDelay: 30_000,
  backoff: 1.5,
}

const DEFAULT_NAME = 'main'

// ─── SocketInstance (internal) ────────────────────────────────────────────────

/**
 * Manages a single WebSocket connection with heartbeat, reconnect, and
 * pre-connect message queue.
 * @internal
 */
class SocketInstance {
  private _ws: WebSocket | null = null
  private _state: SocketState = SocketState.CLOSED
  private _aborted = false

  private readonly _handlers = new Map<string, Set<SocketHandler>>()
  private readonly _queue: unknown[] = []

  private _heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private _pongTimer: ReturnType<typeof setTimeout> | null = null
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private _reconnectAttempts = 0

  private readonly _url: string
  private readonly _protocols: string | string[] | undefined
  private readonly _heartbeat: ResolvedHeartbeat | false
  private readonly _reconnect: ResolvedReconnect | false

  constructor (options: SocketOptions) {
    this._url = options.url
    this._protocols = options.protocols
    this._heartbeat = options.heartbeat === false
      ? false
      : options.heartbeat
        ? { ...DEFAULT_HEARTBEAT, ...options.heartbeat }
        : { ...DEFAULT_HEARTBEAT }
    this._reconnect = options.reconnect === false
      ? false
      : options.reconnect
        ? { ...DEFAULT_RECONNECT, ...options.reconnect }
        : { ...DEFAULT_RECONNECT }
  }

  // ── State ─────────────────────────────────────────────────────────────────

  get state (): SocketState { return this._state }
  get isOpen (): boolean { return this._state === SocketState.OPEN }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  connect (): void {
    this._aborted = false
    this._stopReconnect()
    this._open()
  }

  disconnect (): void {
    this._aborted = true
    this._stopHeartbeat()
    this._stopReconnect()
    this._closeSocket()
  }

  // ── Messaging ─────────────────────────────────────────────────────────────

  /**
   * Send a message.
   * If the connection is not yet open the message is queued and sent
   * automatically once the socket opens.
   */
  send (data: unknown): void {
    if (this.isOpen) {
      this._transmit(data)
    } else {
      this._queue.push(data)
    }
  }

  // ── Event subscription ────────────────────────────────────────────────────

  on (event: string, handler: SocketHandler): void {
    let set = this._handlers.get(event)
    if (!set) { set = new Set(); this._handlers.set(event, set) }
    set.add(handler)
  }

  off (event: string, handler?: SocketHandler): void {
    if (!handler) {
      this._handlers.delete(event)
    } else {
      this._handlers.get(event)?.delete(handler)
    }
  }

  // ── Private internals ─────────────────────────────────────────────────────

  private _emit (event: string, ...args: unknown[]): void {
    const handlers = this._handlers.get(event)
    if (handlers) {
      for (const h of handlers) h(...args)
    }
  }

  private _open (): void {
    const ws = new WebSocket(this._url, this._protocols)
    this._ws = ws
    this._state = SocketState.CONNECTING

    ws.onopen = () => {
      this._state = SocketState.OPEN
      this._reconnectAttempts = 0
      this._startHeartbeat()
      this._flushQueue()
      this._emit('connect')
    }

    ws.onclose = (ev: CloseEvent) => {
      this._state = SocketState.CLOSED
      this._stopHeartbeat()
      if (this._aborted) {
        this._emit('aborted', ev)
      } else {
        this._emit('disconnect', ev)
        this._scheduleReconnect()
      }
    }

    ws.onerror = (ev: Event) => {
      this._emit('error', ev)
    }

    ws.onmessage = (ev: MessageEvent) => {
      const hb = this._heartbeat
      if (hb && hb.isPong(ev.data)) {
        this._resetPongTimer()
        return
      }
      this._emit('message', ev.data, ev)
    }
  }

  private _closeSocket (): void {
    const ws = this._ws
    this._ws = null
    if (ws && ws.readyState < WebSocket.CLOSING) ws.close()
  }

  private _transmit (data: unknown): void {
    const payload = typeof data === 'string' ? data : JSON.stringify(data)
    this._ws?.send(payload)
  }

  private _flushQueue (): void {
    while (this._queue.length > 0) {
      this._transmit(this._queue.shift()!)
    }
  }

  // ── Heartbeat ─────────────────────────────────────────────────────────────

  private _startHeartbeat (): void {
    const hb = this._heartbeat
    if (!hb) return

    this._heartbeatTimer = setInterval(() => {
      if (!this.isOpen) return
      this._transmit(hb.message)
      // Arm pong watchdog — closed by _resetPongTimer on a valid pong
      this._pongTimer = setTimeout(() => {
        // No pong received — force close, reconnect logic takes over
        this._ws?.close()
      }, hb.timeout)
    }, hb.interval)
  }

  private _stopHeartbeat (): void {
    if (this._heartbeatTimer) { clearInterval(this._heartbeatTimer); this._heartbeatTimer = null }
    if (this._pongTimer) { clearTimeout(this._pongTimer); this._pongTimer = null }
  }

  private _resetPongTimer (): void {
    if (this._pongTimer) { clearTimeout(this._pongTimer); this._pongTimer = null }
  }

  // ── Reconnect ─────────────────────────────────────────────────────────────

  private _scheduleReconnect (): void {
    const rc = this._reconnect
    if (!rc) return
    if (rc.maxAttempts > 0 && this._reconnectAttempts >= rc.maxAttempts) return

    const delay = Math.min(
      rc.delay * Math.pow(rc.backoff, this._reconnectAttempts),
      rc.maxDelay,
    )
    this._reconnectAttempts++

    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null
      if (!this._aborted) this._open()
    }, delay)
  }

  private _stopReconnect (): void {
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null }
  }
}

// ─── Subsystem ────────────────────────────────────────────────────────────────

export class SocketSubsystem implements IAppSubsystem {
  readonly name = 'socket'

  private readonly _instances = new Map<string, SocketInstance>()

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async init (): Promise<void> {
    // Subsystem starts empty. Connections are added at runtime via add().
  }

  async dispose (): Promise<void> {
    for (const instance of this._instances.values()) {
      instance.disconnect()
    }
    this._instances.clear()
  }

  // ─── Connection management ─────────────────────────────────────────────────

  /**
   * Create, register, and immediately connect a new WebSocket instance.
   *
   * @param urlOrOptions  WebSocket URL string or a full `SocketOptions` object.
   * @param name          Optional instance name.  Defaults to `'main'`.
   *                      If omitted and `'main'` is already registered,
   *                      a random name is auto-assigned.
   * @returns The actual name under which the instance was registered.
   *
   * @example
   * const n1 = socket.add('wss://example.com')          // → 'main'
   * const n2 = socket.add('wss://example.com/other')    // → 'ws_abc123'
   * const n3 = socket.add('wss://example.com/t', 'trade') // → 'trade'
   * const n4 = socket.add({ url: 'wss://...', heartbeat: { interval: 15_000 } })
   */
  add (urlOrOptions: string | SocketOptions, name?: string): string {
    const opts: SocketOptions = typeof urlOrOptions === 'string'
      ? { url: urlOrOptions }
      : { ...urlOrOptions }

    const assignedName = this._resolveName(name ?? opts.name)

    // Disconnect & replace any pre-existing instance under that name
    this._instances.get(assignedName)?.disconnect()
    const instance = new SocketInstance(opts)
    this._instances.set(assignedName, instance)
    instance.connect()
    return assignedName
  }

  /**
   * Disconnect and remove a named instance.
   * No-op if the name is not registered.
   */
  remove (name: string): void {
    const instance = this._instances.get(name)
    if (!instance) return
    instance.disconnect()
    this._instances.delete(name)
  }

  /**
   * Retrieve a registered instance by name.
   * @throws If no instance is registered under `name`.
   */
  get (name = DEFAULT_NAME): SocketInstance {
    const instance = this._instances.get(name)
    if (!instance) throw new Error(`[SocketSubsystem] No socket registered as "${name}"`)
    return instance
  }

  /** Names of all currently registered connections. */
  connections (): string[] {
    return [...this._instances.keys()]
  }

  // ─── Delegators ────────────────────────────────────────────────────────────

  /**
   * Send data through the named connection (default: `'main'`).
   * If the connection is not yet open, the message is queued and flushed
   * automatically once the socket connects.
   */
  send (data: unknown, name = DEFAULT_NAME): void {
    this.get(name).send(data)
  }

  /**
   * Subscribe to an event on the named connection (default: `'main'`).
   *
   * Built-in events: `'connect'` | `'disconnect'` | `'error'` | `'aborted'` | `'message'`
   *
   * Custom event names are also supported — emit them by calling the handler
   * directly on your `SocketInstance` from application-level code if needed.
   */
  on (event: string, handler: SocketHandler, name = DEFAULT_NAME): void {
    this.get(name).on(event, handler)
  }

  /**
   * Unsubscribe from an event on the named connection (default: `'main'`).
   * Omit `handler` to remove all listeners for that event.
   */
  off (event: string, handler?: SocketHandler, name = DEFAULT_NAME): void {
    this.get(name).off(event, handler)
  }

  /** Current state of the named connection (default: `'main'`). */
  state (name = DEFAULT_NAME): SocketState {
    return this.get(name).state
  }

  /** `true` if the named connection is currently open. */
  isOpen (name = DEFAULT_NAME): boolean {
    return this.get(name).isOpen
  }

  /**
   * Manually (re-)connect a named connection (default: `'main'`).
   * Clears any pending reconnect timer and opens a fresh socket.
   * This is a no-op equivalent to calling `add()` again if you need
   * to change the URL.
   */
  connect (name = DEFAULT_NAME): void {
    this.get(name).connect()
  }

  /**
   * Gracefully disconnect a named connection (default: `'main'`).
   * The instance remains registered — call `connect()` later to reopen it.
   * Pending reconnect timers are cancelled; no automatic reconnect will occur.
   */
  disconnect (name = DEFAULT_NAME): void {
    this.get(name).disconnect()
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _resolveName (name: string | undefined): string {
    if (name) return name
    if (!this._instances.has(DEFAULT_NAME)) return DEFAULT_NAME
    // 'main' already taken — generate a short random identifier
    return `ws_${Math.random().toString(36).slice(2, 8)}`
  }
}
