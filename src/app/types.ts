/**
 * Core interfaces for the Application subsystem architecture.
 *
 * Every subsystem implements `IAppSubsystem<AppT>` where `AppT` is the
 * minimal slice of the application the subsystem needs during `init`.
 * This keeps coupling explicit and type-safe without a circular dependency.
 */
import type { Accessor } from 'solid-js'
import type { AUTH_ROLE } from '@/config'

// ─── Context ──────────────────────────────────────────────────────────────────

/**
 * Static snapshot of the runtime environment.
 * Captured once at Application construction time.
 */
export type AppContext = {
  /** Web app JS bundle version from VITE_APP_VERSION env. Empty string when unset. */
  jsVersion: string
  /** Raw navigator.userAgent string. */
  ua: string
  /** window.location.href captured at the moment the app started. */
  launchUrl: string
  /** True when running in a normal browser tab (not inside a native WebView). */
  isWeb: boolean
  /** True on desktop/laptop browsers (no mobile OS detected). */
  isPC: boolean
  /** True when running on an iOS device or simulator. */
  isIOS: boolean
  /** True when running on an Android device. */
  isAndroid: boolean
  /**
   * True when a native JSBridge is detected (iOS WKWebView / Android WebView).
   * Equivalent to `BridgeSubsystem.isAvailable`.
   */
  isHybrid: boolean
  /**
   * Native host app version string, e.g. `'2.3.1'`.
   * Populated during boot via the BridgeSubsystem, or manually via `setAppVersion()`.
   * `null` on the web or before the bridge responds.
   */
  appVersion: string | null
  /** Node environment string, e.g. `'development'` or `'production'`. */
  env: string
  /** Vite build mode, e.g. `'development'`, `'production'`, `'test'`. */
  mode: string
  /**
   * Stable browser fingerprint for this device/browser instance.
   * Generated from browser traits on first visit and persisted in localStorage.
   */
  webId: string
}

// ─── AppBase ──────────────────────────────────────────────────────────────────

/** Minimal application surface exposed to every subsystem during boot. */
export interface AppBase {
  readonly locale: Accessor<string>
  setLocale(lang: string): void
  /**
   * The system-level role of the current session.
   * Reflects *who is using the app*, not what the user account permits:
   *   PASSENGER — no active session (anonymous visitor)
   *   GUEST     — temporary / trial session
   *   USER+     — authenticated user
   */
  readonly role: Accessor<AUTH_ROLE>
  /** Update the system-level role. Called by AccountSubsystem on session changes. */
  setRole(r: AUTH_ROLE): void
  /**
   * Retrieve a registered subsystem by its key name.
   * Useful for optional/dynamic dependencies — avoids hard-coding the full
   * `AppBase & { account: AccountSubsystem }` intersection type.
   *
   * @throws If no subsystem is registered under `name`.
   *
   * @example
   * // In a subsystem that optionally uses account — no direct import needed:
   * const account = app.use<AccountSubsystem>('account')
   * account.current()?.['userId']
   */
  use<T extends IAppSubsystem>(name: string): T

  /**
   * Subscribe to system-level role changes.
   * Returns an unsubscribe function. Useful for subsystems that need to react
   * to login/logout without coupling directly to AccountSubsystem.
   *
   * @example
   * // In SocketSubsystem.init():
   * app.onRole(role => {
   *   if (role >= USER_ROLE.USER) this.connect()
   *   else this.disconnect()
   * })
   */
  onRole(handler: (role: AUTH_ROLE) => void): () => void
  /**
   * Subscribe to locale changes.
   * Returns an unsubscribe function.
   */
  onLocale(handler: (lang: string) => void): () => void
  /**
   * Reactive signal — `true` once all subsystems have finished `init()`.
   * Use to gate rendering or defer work until the app is fully ready.
   */
  readonly isReady: Accessor<boolean>
  ready(): Promise<void>

  // ── Context (top-level, captured at construction) ──────────────────────────
  readonly jsVersion: string
  readonly ua: string
  readonly launchUrl: string
  readonly isWeb: boolean
  readonly isPC: boolean
  readonly isIOS: boolean
  readonly isAndroid: boolean
  readonly isHybrid: boolean
  readonly appVersion: string | null
  /** Node environment string, e.g. `'development'` or `'production'`. */
  readonly env: string
  /** Vite build mode, e.g. `'development'`, `'production'`, `'test'`. */
  readonly mode: string
  /**
   * Stable browser fingerprint for this device/browser instance.
   * Generated from browser traits on first visit and persisted in localStorage.
   */
  readonly webId: string
  /** Returns a frozen snapshot of the current context. */
  context(): Readonly<AppContext>
  /**
   * Manually update the native app version.
   * Use when the version is retrieved outside of the boot sequence.
   */
  setAppVersion(version: string): void
}

/**
 * Contract every subsystem must satisfy.
 *
 * @template AppT - The minimal application interface this subsystem requires.
 *   Default is `AppBase`. Declare a narrower type when you only need specific
 *   peer subsystems, e.g. `IAppSubsystem<AppBase & { account: AccountSubsystem }>`.
 */
export interface IAppSubsystem<AppT extends AppBase = AppBase> {
  /** Unique identifier — used for logging and debugging. */
  readonly name: string
  /**
   * Initialization priority. Lower values run first.
   * Subsystems with the same priority initialize in registration order.
   *
   * Built-in priority tiers:
   *   -100  BridgeSubsystem (native handshake — must resolve isHybrid first)
   *    -50  ConfigSubsystem (remote config — available to all later subsystems)
   *      0  (default) all other subsystems
   */
  readonly priority?: number
  /** Called once during `Application.boot()`, in priority then registration order. */
  init?(app: AppT): void | Promise<void>
  /** Called when the application is torn down (e.g. in tests or SSR). */
  dispose?(): void | Promise<void>
}
