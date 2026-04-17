/**
 * NetworkSubsystem — Reactive network connectivity and page visibility.
 *
 * Responsibilities:
 *  - Track online / offline state via `navigator.onLine` + browser events.
 *  - Track page visibility (foreground / background) via `document.visibilityState`.
 *  - Expose reactive signals (`isOnline`, `isVisible`) for UI and business logic.
 *  - Allow other subsystems to subscribe without coupling to each other.
 *  - Clean up all event listeners on `dispose()`.
 *
 * Typical uses:
 *  - Pause / resume data polling based on visibility.
 *  - Reconnect WebSocket when coming back online (subscribe via `onConnectionChange`).
 *  - Show an offline banner reactively in the UI.
 *
 * Usage:
 * ```ts
 * // In SocketSubsystem.init():
 * app.onRole(role => {
 *   if (role >= USER_ROLE.USER) {
 *     app.network.onConnectionChange(online => {
 *       if (online) this.connect()
 *     })
 *   }
 * })
 *
 * // In a SolidJS component:
 * const online = () => application.network.isOnline()
 * <Show when={!online()}>
 *   <OfflineBanner />
 * </Show>
 * ```
 */
import { Accessor, createSignal } from 'solid-js'
import type { IAppSubsystem } from '../types'

export class NetworkSubsystem implements IAppSubsystem {
  readonly name = 'network'

  private readonly _isOnline: Accessor<boolean>
  private readonly _setIsOnline: (v: boolean) => void
  private readonly _isVisible: Accessor<boolean>
  private readonly _setIsVisible: (v: boolean) => void

  private readonly _connectionListeners = new Set<(online: boolean) => void>()
  private readonly _visibilityListeners = new Set<(visible: boolean) => void>()

  // Bound handler refs — stored so dispose() removes the exact same functions.
  private readonly _handleOnline: () => void
  private readonly _handleOffline: () => void
  private readonly _handleVisibility: () => void

  constructor () {
    const [isOnline, setIsOnline] = createSignal(
      typeof navigator !== 'undefined' ? navigator.onLine : true,
    )
    this._isOnline = isOnline
    this._setIsOnline = setIsOnline

    const [isVisible, setIsVisible] = createSignal(
      typeof document !== 'undefined' ? document.visibilityState !== 'hidden' : true,
    )
    this._isVisible = isVisible
    this._setIsVisible = setIsVisible

    this._handleOnline = () => {
      this._setIsOnline(true)
      this._connectionListeners.forEach(h => h(true))
    }
    this._handleOffline = () => {
      this._setIsOnline(false)
      this._connectionListeners.forEach(h => h(false))
    }
    this._handleVisibility = () => {
      const visible = document.visibilityState !== 'hidden'
      this._setIsVisible(visible)
      this._visibilityListeners.forEach(h => h(visible))
    }
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  init (): void {
    window.addEventListener('online', this._handleOnline)
    window.addEventListener('offline', this._handleOffline)
    document.addEventListener('visibilitychange', this._handleVisibility)
  }

  dispose (): void {
    window.removeEventListener('online', this._handleOnline)
    window.removeEventListener('offline', this._handleOffline)
    document.removeEventListener('visibilitychange', this._handleVisibility)
    this._connectionListeners.clear()
    this._visibilityListeners.clear()
  }

  // ─── Reactive accessors ────────────────────────────────────────────────────

  /** Reactive signal — `true` when the browser has network connectivity. */
  isOnline (): boolean {
    return this._isOnline()
  }

  /** Reactive signal — `true` when the page is in the foreground (not hidden). */
  isVisible (): boolean {
    return this._isVisible()
  }

  // ─── Subscriptions ────────────────────────────────────────────────────────

  /**
   * Subscribe to online / offline transitions.
   * `handler(true)` = came online; `handler(false)` = went offline.
   * Returns an unsubscribe function.
   *
   * @example
   * // Reconnect socket when network is restored:
   * app.network.onConnectionChange(online => {
   *   if (online) application.socket.connect()
   * })
   */
  onConnectionChange (handler: (online: boolean) => void): () => void {
    this._connectionListeners.add(handler)
    return () => this._connectionListeners.delete(handler)
  }

  /**
   * Subscribe to page visibility transitions.
   * `handler(true)` = page became visible; `handler(false)` = page hidden.
   * Returns an unsubscribe function.
   *
   * @example
   * // Refresh stale data when user returns to the tab:
   * app.network.onVisibilityChange(visible => {
   *   if (visible) fetchLatestData()
   * })
   */
  onVisibilityChange (handler: (visible: boolean) => void): () => void {
    this._visibilityListeners.add(handler)
    return () => this._visibilityListeners.delete(handler)
  }
}
