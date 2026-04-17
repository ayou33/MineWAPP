/**
 * Application — top-level singleton class.
 *
 * Wires subsystems together and orchestrates the boot sequence.
 * The `createApplication` factory returns an intersection type so subsystems
 * are accessible as direct named properties with full type inference.
 *
 * Boot order is controlled by `IAppSubsystem.priority` (lower = earlier).
 * Subsystems with the same priority initialize in registration order.
 * After each subsystem initializes, if it exposes `isAvailable: boolean` and
 * `appVersion: string` (duck-typed bridge contract), the app context is updated
 * so subsequent subsystems see the correct `isHybrid` / `appVersion` values.
 */
import { LOCAL_USER_KEYS, AUTH_ROLE } from '@/config'
import { defaultLocale, readSystemLang } from '@/config/locale'
import { localGet, localSet } from 'lunzi'
import { Accessor, createSignal } from 'solid-js'
import type { AppBase, AppContext, IAppSubsystem } from '@/app/subsystems'
import { resolveWebId } from '@/app/webId'

export type SubsystemMap = Record<string, IAppSubsystem<any>>

/** The fully typed application instance: Application core + all subsystems as own properties. */
export type ApplicationInstance<SS extends SubsystemMap> = Application<SS> & SS

export class Application<SS extends SubsystemMap> implements AppBase {
  readonly locale: Accessor<string>
  readonly setLocale: (lang: string) => void

  /**
   * Reactive system-level role — who is currently using the app.
   * Set by AccountSubsystem on login / logout / asGuest.
   * Starts at PASSENGER (no session) and is updated synchronously when
   * a persisted session is restored during boot.
   */
  readonly role: Accessor<AUTH_ROLE>
  readonly setRole: (r: AUTH_ROLE) => void

  /**
   * Reactive flag — becomes `true` once all subsystems have finished `init()`.
   * Use in root components to gate rendering until the app is fully ready.
   */
  readonly isReady: Accessor<boolean>
  private readonly _setIsReady: (v: boolean) => void

  // ── Subscription sets ──────────────────────────────────────────────────────
  private readonly _roleListeners = new Set<(role: AUTH_ROLE) => void>()
  private readonly _localeListeners = new Set<(lang: string) => void>()

  // ── Context ────────────────────────────────────────────────────────────────
  readonly jsVersion: string
  readonly ua: string
  readonly launchUrl: string
  readonly isPC: boolean
  readonly isIOS: boolean
  readonly isAndroid: boolean
  private _isHybrid = false
  private _isWeb = true
  get isHybrid (): boolean { return this._isHybrid }
  get isWeb (): boolean { return this._isWeb }
  private _appVersion: string | null = null

  get appVersion (): string | null { return this._appVersion }

  /** `process.env.NODE_ENV` captured at construction time. */
  readonly env: string
  /** `import.meta.env.MODE` captured at construction time. */
  readonly mode: string
  /**
   * Stable browser fingerprint persisted in localStorage.
   * Derived from browser traits on first visit; subsequent visits reload the same value.
   */
  readonly webId: string

  /** Returns a frozen snapshot of the current runtime context. */
  context (): Readonly<AppContext> {
    return Object.freeze({
      jsVersion: this.jsVersion,
      ua: this.ua,
      launchUrl: this.launchUrl,
      isWeb: this.isWeb,
      isPC: this.isPC,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      isHybrid: this.isHybrid,
      appVersion: this._appVersion,
      env: this.env,
      mode: this.mode,
      webId: this.webId,
    })
  }

  /**
   * Manually set the native app version.
   * Use when the version is retrieved outside `boot()`, e.g. from a
   * deferred bridge call or a custom native message handler.
   */
  setAppVersion (version: string): void {
    this._appVersion = version
  }

  /**
   * Retrieve a registered subsystem by its key name.
   * Provides optional/dynamic subsystem access without requiring a full
   * `AppBase & { account: AccountSubsystem }` intersection type at the call site.
   *
   * @throws If no subsystem is registered under `name`.
   */
  use<T extends IAppSubsystem<any>> (name: string): T {
    const system = (this._systems as Record<string, IAppSubsystem<any>>)[name]
    if (!system) throw new Error(`[Application] No subsystem registered under "${name}"`)
    return system as unknown as T
  }

  /**
   * Subscribe to system-level role changes.
   * Returns an unsubscribe function.
   */
  onRole (handler: (role: AUTH_ROLE) => void): () => void {
    this._roleListeners.add(handler)
    return () => this._roleListeners.delete(handler)
  }

  /**
   * Subscribe to locale changes.
   * Returns an unsubscribe function.
   */
  onLocale (handler: (lang: string) => void): () => void {
    this._localeListeners.add(handler)
    return () => this._localeListeners.delete(handler)
  }

  private readonly _systems: SS
  private _bootPromise: Promise<void> | null = null

  constructor (systems: SS) {
    this._systems = systems

    // ── isReady ─────────────────────────────────────────────────────────────
    const [isReady, setIsReady] = createSignal(false)
    this.isReady = isReady
    this._setIsReady = setIsReady

    // ── Locale ──────────────────────────────────────────────────────────────
    // Locale is a core concern shared by i18n, request layer, and subsystems.
    const saved = localGet(LOCAL_USER_KEYS.LOCALE) || readSystemLang() || defaultLocale
    const [locale, setLocale] = createSignal<string>(saved)
    this.locale = locale
    this.setLocale = (lang: string) => {
      localSet(LOCAL_USER_KEYS.LOCALE, lang)
      setLocale(lang)
      this._localeListeners.forEach(h => h(lang))
    }

    // ── Role ────────────────────────────────────────────────────────────────
    // Role starts as anonymous — AccountSubsystem.init() will restore
    // the correct value from any persisted session.
    const [role, setRole] = createSignal<AUTH_ROLE>(AUTH_ROLE.PASSENGER)
    this.role = role
    this.setRole = (r: AUTH_ROLE) => {
      setRole(r)
      this._roleListeners.forEach(h => h(r))
    }

    // ── Context ─────────────────────────────────────────────────────────────
    // All static environment fields are captured once here, before any
    // subsystem initializes, so they are available immediately.
    const ua = navigator.userAgent
    const isIOS = /\(i[^;]+;( U;)? CPU.+Mac OS X/.test(ua)
    const isAndroid = ua.includes('Android') || (!isIOS && ua.includes('Linux'))
    this.ua = ua
    this.isIOS = isIOS
    this.isAndroid = isAndroid
    this.isPC = !isIOS && !isAndroid
    this.jsVersion = import.meta.env.VITE_APP_VERSION ?? ''
    this.launchUrl = window.location.href
    this.env = process.env.NODE_ENV ?? 'production'
    this.mode = import.meta.env.MODE
    this.webId = resolveWebId()

    // Attach every subsystem as a direct property so callers can write
    // `application.account.login()` rather than `application.use('account').login()`.
    Object.assign(this, systems)
  }

  /**
   * Initialize the application once.
   * Subsystems run in ascending `priority` order (ties break on registration order).
   * Subsequent calls return the same promise.
   */
  boot (): Promise<void> {
    if (this._bootPromise) return this._bootPromise
    this._bootPromise = this._initialize()
    return this._bootPromise
  }

  /** Alias for `boot()` — used at the entry point to gate rendering. */
  ready (): Promise<void> {
    return this.boot()
  }

  /** Tear down all subsystems (useful in tests or SSR). */
  async dispose (): Promise<void> {
    for (const system of Object.values(this._systems)) {
      await system.dispose?.()
    }
    this._roleListeners.clear()
    this._localeListeners.clear()
    this._bootPromise = null
    this._setIsReady(false)
  }

  private async _initialize (): Promise<void> {
    // Sort by priority (ascending), preserving insertion order for ties.
    // Object.entries() preserves insertion order in all modern JS engines.
    const sorted = Object.entries(this._systems).sort(
      ([, a], [, b]) => (a.priority ?? 0) - (b.priority ?? 0),
    )

    for (const [, system] of sorted) {
      await system.init?.(this as unknown as ApplicationInstance<SS>)

      // Duck-type check: if this subsystem acts as a native bridge provider,
      // update isHybrid / appVersion so subsequent subsystems see the correct values.
      // This avoids hard-coding the 'bridge' key while preserving the ordering guarantee.
      if (hasBridgeContext(system)) {
        this._isHybrid = system.isAvailable
        this._isWeb = !this._isHybrid
        if (system.appVersion) this._appVersion = system.appVersion
      }
    }

    this._setIsReady(true)
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Shape that a bridge-like subsystem exposes after its init(). */
type BridgeContext = { isAvailable: boolean; appVersion: string }

/** Duck-type guard — true if the subsystem exposes the bridge context contract. */
function hasBridgeContext (system: IAppSubsystem<any>): system is IAppSubsystem<any> & BridgeContext {
  return 'isAvailable' in system
    && typeof (system as Record<string, unknown>)['isAvailable'] === 'boolean'
    && 'appVersion' in system
}

/**
 * Create a typed Application instance.
 *
 * The returned type is `Application<SS> & SS`, meaning every subsystem key
 * is directly accessible on the returned object.
 *
 * @example
 * ```ts
 * const application = createApplication({
 *   account: new AccountSubsystem(),
 *   bridge:  new BridgeSubsystem('bridge', 'init'),
 *   report:  new ReportSubsystem(),
 * })
 *
 * application.account.loginWith('password', creds)
 * application.bridge.call('getToken')
 * application.isHybrid   // top-level context
 * application.appVersion // top-level context
 * await application.ready()
 * ```
 */
export function createApplication<SS extends SubsystemMap> (systems: SS): ApplicationInstance<SS> {
  return new Application(systems) as ApplicationInstance<SS>
}
