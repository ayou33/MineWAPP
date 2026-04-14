/**
 * Core interfaces for the Application subsystem architecture.
 *
 * Every subsystem implements `IAppSubsystem<AppT>` where `AppT` is the
 * minimal slice of the application the subsystem needs during `init`.
 * This keeps coupling explicit and type-safe without a circular dependency.
 */
import type { Accessor } from 'solid-js'
import type { USER_ROLE } from '@/config'

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
  readonly role: Accessor<USER_ROLE>
  /** Update the system-level role. Called by AccountSubsystem on session changes. */
  setRole(r: USER_ROLE): void
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
  /** Called once during `Application.boot()`, in registration order. */
  init?(app: AppT): void | Promise<void>
  /** Called when the application is torn down (e.g. in tests or SSR). */
  dispose?(): void | Promise<void>
}
