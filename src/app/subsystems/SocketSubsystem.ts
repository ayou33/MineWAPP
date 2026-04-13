/**
 * SocketSubsystem — Named socket connection manager.
 *
 * Responsibilities:
 *  - Hold one or more named socket connections (default name: 'main').
 *  - Delegate lifecycle (connect / disconnect) to each socket on boot / teardown.
 *  - Provide a unified API for sending messages and subscribing to events
 *    without callers needing to reference the socket instance directly.
 *  - Support runtime addition and removal of connections.
 *
 * Usage:
 * ```ts
 * // Single connection (name defaults to 'main')
 * const application = createApplication({
 *   socket: new SocketSubsystem(new MyWebSocketAdapter('wss://example.com')),
 * })
 *
 * // Multiple named connections
 * const application = createApplication({
 *   socket: new SocketSubsystem({
 *     main:  new MyWebSocketAdapter('wss://example.com/chat'),
 *     trade: new MyWebSocketAdapter('wss://example.com/trade'),
 *   }),
 * })
 *
 * // Access a connection
 * application.socket.on('message', handler)          // uses 'main'
 * application.socket.on('message', handler, 'trade') // uses 'trade'
 * application.socket.send({ type: 'ping' })
 * ```
 *
 * Implementing an adapter:
 * ```ts
 * class MyWebSocketAdapter implements ISocket {
 *   private _ws: WebSocket | null = null
 *   readonly state = SocketState.CLOSED
 *   connect() { this._ws = new WebSocket(this._url) }
 *   disconnect() { this._ws?.close() }
 *   send(data) { this._ws?.send(JSON.stringify(data)) }
 *   on(event, handler) { this._ws?.addEventListener(event, handler) }
 *   off(event, handler) { this._ws?.removeEventListener(event, handler) }
 * }
 * ```
 */
import type { IAppSubsystem } from './types'

// ─── Public types ─────────────────────────────────────────────────────────────

export type SocketHandler = (...args: unknown[]) => void

export enum SocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

/**
 * Contract that every socket adapter must satisfy.
 * The subsystem is agnostic to the transport — WebSocket, Socket.IO,
 * SSE, or a mock adapter for testing all work as long as this interface
 * is implemented.
 */
export interface ISocket {
  /** Current connection state. */
  readonly state: SocketState
  /** Establish the connection. May be asynchronous. */
  connect(): void | Promise<void>
  /** Gracefully close the connection. */
  disconnect(): void
  /**
   * Send data through the connection.
   * The adapter is responsible for serialization (e.g. JSON.stringify).
   * Should be a no-op or throw when the socket is not open.
   */
  send(data: unknown): void
  /** Subscribe to a named socket event (e.g. `'message'`, `'error'`, `'close'`). */
  on(event: string, handler: SocketHandler): void
  /** Unsubscribe. Omit `handler` to remove all listeners for the event. */
  off(event: string, handler?: SocketHandler): void
}

export type SocketMap = Record<string, ISocket>

const DEFAULT = 'main'

// ─── Subsystem ────────────────────────────────────────────────────────────────

export class SocketSubsystem implements IAppSubsystem {
  readonly name = 'socket'

  private readonly _sockets: Map<string, ISocket>

  /**
   * @param input A single `ISocket` (registered as `'main'`) or a map of
   *   named sockets `{ [name]: ISocket }`.
   */
  constructor (input: ISocket | SocketMap) {
    this._sockets = new Map(
      isISocket(input)
        ? [[DEFAULT, input]]
        : Object.entries(input),
    )
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async init (): Promise<void> {
    for (const [, socket] of this._sockets) {
      await socket.connect()
    }
  }

  async dispose (): Promise<void> {
    for (const [, socket] of this._sockets) {
      socket.disconnect()
    }
  }

  // ─── Connection management ─────────────────────────────────────────────────

  /**
   * Retrieve a registered socket by name.
   * @throws if no socket is registered under `name`.
   */
  get (name = DEFAULT): ISocket {
    const socket = this._sockets.get(name)
    if (!socket) throw new Error(`[SocketSubsystem] No socket registered under "${name}"`)
    return socket
  }

  /**
   * Register a new named connection at runtime and immediately connect it.
   * If a socket already exists under `name`, it is disconnected and replaced.
   */
  async add (name: string, socket: ISocket): Promise<void> {
    const existing = this._sockets.get(name)
    if (existing) existing.disconnect()
    this._sockets.set(name, socket)
    await socket.connect()
  }

  /**
   * Disconnect and unregister a named connection.
   * No-op if the name is not registered.
   */
  remove (name: string): void {
    const socket = this._sockets.get(name)
    if (!socket) return
    socket.disconnect()
    this._sockets.delete(name)
  }

  /** Returns the names of all currently registered connections. */
  connections (): string[] {
    return [...this._sockets.keys()]
  }

  // ─── Convenience delegators ────────────────────────────────────────────────

  /** Send data through the named connection (default: `'main'`). */
  send (data: unknown, name = DEFAULT): void {
    this.get(name).send(data)
  }

  /** Subscribe to an event on the named connection (default: `'main'`). */
  on (event: string, handler: SocketHandler, name = DEFAULT): void {
    this.get(name).on(event, handler)
  }

  /** Unsubscribe from an event on the named connection (default: `'main'`). */
  off (event: string, handler?: SocketHandler, name = DEFAULT): void {
    this.get(name).off(event, handler)
  }

  /** Current state of the named connection (default: `'main'`). */
  state (name = DEFAULT): SocketState {
    return this.get(name).state
  }

  /** `true` if the named connection is currently open. */
  isOpen (name = DEFAULT): boolean {
    return this.get(name).state === SocketState.OPEN
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Duck-type guard: is `value` an `ISocket` rather than a `SocketMap`? */
function isISocket (value: ISocket | SocketMap): value is ISocket {
  return typeof (value as ISocket).connect === 'function'
    && typeof (value as ISocket).send === 'function'
}
