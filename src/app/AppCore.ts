/**
 * Application — top-level singleton class.
 *
 * Wires subsystems together and orchestrates the boot sequence.
 * The `createApplication` factory returns an intersection type so subsystems
 * are accessible as direct named properties with full type inference
 *
 */
import { LOCAL_USER_KEYS, USER_ROLE } from '@/config'
import { defaultLocale, readSystemLang } from '@/config/locale'
import { localGet, localSet } from 'lunzi'
import { Accessor, createSignal } from 'solid-js'
import type { AppBase, AppContext, IAppSubsystem } from '@/app/subsystems'
import type { BridgeSubsystem } from '@/app/subsystems/bridge/BridgeSubsystem'
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
  readonly role: Accessor<USER_ROLE>
  readonly setRole: (r: USER_ROLE) => void

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

  private readonly _systems: SS
  private _bootPromise: Promise<void> | null = null

  constructor (systems: SS) {
    this._systems = systems

    // ── Locale ──────────────────────────────────────────────────────────────
    // Locale is a core concern shared by i18n, request layer, and subsystems.
    const saved = localGet(LOCAL_USER_KEYS.LOCALE) || readSystemLang() || defaultLocale
    const [locale, setLocale] = createSignal<string>(saved)
    this.locale = locale
    this.setLocale = (lang: string) => {
      localSet(LOCAL_USER_KEYS.LOCALE, lang)
      setLocale(lang)
    }

    // ── Role ────────────────────────────────────────────────────────────────
    // Role starts as anonymous — AccountSubsystem.init() will restore
    // the correct value from any persisted session.
    const [role, setRole] = createSignal<USER_ROLE>(USER_ROLE.PASSENGER)
    this.role = role
    this.setRole = setRole

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
   * Calls `subsystem.init(this)` on each registered subsystem in order.
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
    this._bootPromise = null
  }

  private async _initialize (): Promise<void> {
    // Bridge must initialize first — its handshake determines isHybrid for
    // every other subsystem that may query the flag during their own init.
    const bridgeEntry = (this._systems as Record<string, IAppSubsystem<any>>)['bridge']
    if (bridgeEntry) {
      await bridgeEntry.init?.(this as unknown as ApplicationInstance<SS>)
      const bridge = bridgeEntry as unknown as Pick<BridgeSubsystem, 'isAvailable' | 'appVersion'>
      this._isHybrid = bridge.isAvailable
      this._isWeb = !this._isHybrid
      // appVersion is delivered as part of the handshake response — no extra RPC needed.
      if (bridge.appVersion) this._appVersion = bridge.appVersion
    }

    for (const [key, system] of Object.entries(this._systems)) {
      if (key === 'bridge') continue // already initialized above
      await system.init?.(this as unknown as ApplicationInstance<SS>)
    }
  }
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
 *   bridge:  new BridgeSubsystem(),
 *   schema:  new ApiSchemaSubsystem(),
 *   report:  new ReportSubsystem(),
 * })
 *
 * application.account.login(userData)
 * application.bridge.call('getToken')
 * application.isHybrid   // top-level context
 * application.appVersion // top-level context
 * await application.ready()
 * ```
 */
export function createApplication<SS extends SubsystemMap> (systems: SS,): ApplicationInstance<SS> {
  return new Application(systems) as ApplicationInstance<SS>
}
