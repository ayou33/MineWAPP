/**
 * ContextSubsystem — Application environment context.
 *
 * Responsibilities:
 *  - Collect all static environment information once at construction time
 *    (UA, platform flags, launch URL, JS version, hybrid detection).
 *  - Expose a typed `AppContext` snapshot accessible anywhere in the app.
 *  - Optionally enrich context with the native app version by calling
 *    `app.bridge.call('getAppVersion')` during init (no-op when bridge
 *    is unavailable).
 *
 * Usage:
 * ```ts
 * // Read the full context snapshot
 * const ctx = application.context.get()
 * if (ctx.isHybrid) { ... }
 *
 * // Or use individual property getters
 * application.context.isHybrid    // boolean
 * application.context.appVersion  // string | null
 * application.context.launchUrl   // string
 * ```
 *
 * Populating appVersion manually (if not using BridgeSubsystem):
 * ```ts
 * application.context.setAppVersion('1.2.3')
 * ```
 */
import type { AppBase, IAppSubsystem } from './types'
import type { BridgeSubsystem } from './BridgeSubsystem'

// ─── Types ────────────────────────────────────────────────────────────────────

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
   * Populated via `init()` (bridge call) or `setAppVersion()`.
   * `null` when running on the web or before the bridge responds.
   */
  appVersion: string | null
}

// Optional bridge dependency — subsystem works without it.
interface AppWithBridge extends AppBase {
  bridge?: Pick<BridgeSubsystem, 'isAvailable' | 'call'>
}

// ─── Subsystem ────────────────────────────────────────────────────────────────

export class ContextSubsystem implements IAppSubsystem<AppWithBridge> {
  readonly name = 'context'

  private readonly _ctx: AppContext

  constructor () {
    const ua = navigator.userAgent
    const isIOS = /\(i[^;]+;( U;)? CPU.+Mac OS X/.test(ua)
    const isAndroid = ua.includes('Android') || (!isIOS && ua.includes('Linux'))
    const isPC = !isIOS && !isAndroid
    // A native WebView bridge is present when the dedicated global is exposed.
    const w = window as unknown as Record<string, unknown>
    const iosHandlers = (w['webkit'] as Record<string, unknown> | undefined)?.['messageHandlers'] as
      Record<string, unknown> | undefined
    const isHybrid =
      (iosHandlers !== null && iosHandlers !== undefined && typeof iosHandlers['bridge'] !== 'undefined') ||
      typeof w['__bridge'] !== 'undefined'

    this._ctx = {
      jsVersion: import.meta.env.VITE_APP_VERSION ?? '',
      ua,
      launchUrl: window.location.href,
      isWeb: !isHybrid,
      isPC,
      isIOS,
      isAndroid,
      isHybrid,
      appVersion: null,
    }
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * If BridgeSubsystem is registered and available, attempt to fetch the
   * native host app version. Failure is silently ignored so a bridge timeout
   * or absence never blocks the boot sequence.
   */
  async init (app: AppWithBridge): Promise<void> {
    if (!this._ctx.isHybrid || !app.bridge?.isAvailable) return
    try {
      const version = await app.bridge.call<string>('getAppVersion')
      if (version) this._ctx.appVersion = version
    } catch {
      // Bridge responded with an error or the method is not implemented.
      // appVersion stays null — non-fatal.
    }
  }

  // ─── Read ───────────────────────────────────────────────────────────────────

  /** Returns the full context snapshot. The object reference is stable. */
  get (): Readonly<AppContext> {
    return this._ctx
  }

  get jsVersion (): string { return this._ctx.jsVersion }
  get ua (): string { return this._ctx.ua }
  get launchUrl (): string { return this._ctx.launchUrl }
  get isWeb (): boolean { return this._ctx.isWeb }
  get isPC (): boolean { return this._ctx.isPC }
  get isIOS (): boolean { return this._ctx.isIOS }
  get isAndroid (): boolean { return this._ctx.isAndroid }
  get isHybrid (): boolean { return this._ctx.isHybrid }
  get appVersion (): string | null { return this._ctx.appVersion }

  // ─── Write ──────────────────────────────────────────────────────────────────

  /**
   * Manually set the native app version.
   * Use this when you retrieve the version outside of `init()`, e.g. after a
   * deferred bridge call or from a custom native message handler.
   */
  setAppVersion (version: string): void {
    this._ctx.appVersion = version
  }
}
