/**
 * AccountSubsystem — User session, authentication and permission management.
 *
 * Responsibilities:
 *  - Persist / restore the logged-in user across page refreshes.
 *  - Expose a reactive `current()` signal consumed by the rest of the app.
 *  - Notify the Application of system-level role changes (PASSENGER / GUEST / USER)
 *    via `app.setRole()` on every session transition.
 *  - Pluggable auth strategies (password, WeChat, Google, Apple, token, …).
 *  - Maintain a reactive named-permission set for fine-grained UI control.
 *    Permissions are cleared automatically on logout.
 *
 * Usage:
 *   // 1. Register auth strategies (e.g. in application.ts or _app.tsx):
 *   application.account
 *     .register('password', new PasswordStrategy())
 *     .register('wechat',   new WeChatOAuthStrategy())
 *
 *   // 2. Login via a named provider:
 *   await application.account.loginWith('password', { username, password })
 *   await application.account.loginWith('wechat')
 *
 *   // 3. Or write a session directly (e.g. from a token refresh):
 *   application.account.login(userData)
 *
 *   // 4. Manage permissions after login:
 *   application.account.loadPermissions(['edit:post', 'delete:comment'])
 *   application.account.hasPermission('edit:post')  // true
 *
 *   // 5. Logout (also clears permissions):
 *   application.account.logout()
 */
import { LOCAL_USER_KEYS, AUTH_ROLE } from '@/config'
import { localGet, localSet } from 'lunzi'
import { Accessor, createSignal, Setter } from 'solid-js'
import type { AppBase, IAppSubsystem } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Opaque user payload — the system only cares whether a session exists. */
export type AppUser = Record<string, unknown>

/** A named permission string, e.g. `'edit:post'` or `'admin'`. */
export type Permission = string

/** Stable string key that identifies an authentication provider. */
export type AuthProvider = string

/**
 * Contract every auth strategy must implement.
 *
 * @template P - The parameter shape this strategy expects (login credentials,
 *               OAuth tokens, etc.). Use `unknown` when no params are needed.
 */
export interface IAuthStrategy<P = unknown> {
  /** Perform the authentication flow and return the user payload on success. */
  execute(params: P): Promise<AppUser>
}

// ─── AccountSubsystem ─────────────────────────────────────────────────────────

export class AccountSubsystem implements IAppSubsystem {
  readonly name = 'account'

  private readonly _user: Accessor<AppUser | null>
  private readonly _setUser: Setter<AppUser | null>

  private readonly _permissions: Accessor<ReadonlySet<Permission>>
  private readonly _setPermissions: Setter<ReadonlySet<Permission>>

  private readonly _strategies = new Map<AuthProvider, IAuthStrategy>()

  /** Stored during init() — used to push role changes up to the Application. */
  private _setAppRole: ((r: AUTH_ROLE) => void) | null = null

  constructor () {
    const saved = localGet(LOCAL_USER_KEYS.USER) as AppUser | null
    const [user, setUser] = createSignal<AppUser | null>(saved)
    this._user = user
    this._setUser = setUser

    const [perms, setPerms] = createSignal<ReadonlySet<Permission>>(new Set(), {
      // Sets are mutable objects — disable SolidJS equality check so signals
      // always re-notify after loadPermissions / clearPermissions.
      equals: false,
    })
    this._permissions = perms
    this._setPermissions = setPerms
  }

  /**
   * Called once during Application.boot().
   * Restores the system role from any persisted session so the app starts
   * in the correct access state without waiting for a reactive effect.
   */
  init (app: AppBase): void {
    this._setAppRole = app.setRole
    app.setRole(this._user() ? AUTH_ROLE.USER : AUTH_ROLE.PASSENGER)
  }

  dispose (): void {
    this._strategies.clear()
    this.clearPermissions()
    this._setAppRole = null
  }

  // ─── Session read ───────────────────────────────────────────────────────────

  /** Reactive accessor — returns the current user or `null` if unauthenticated. */
  current (): AppUser | null {
    return this._user()
  }

  /** Whether a user session is active (includes guest sessions). */
  isLoggedIn (): boolean {
    return this._user() !== null
  }

  // ─── Session write ──────────────────────────────────────────────────────────

  /** Persist user data and activate a full authenticated session. */
  login (userData: AppUser): void {
    localSet(LOCAL_USER_KEYS.USER, userData)
    this._setUser(userData)
    this._setAppRole?.(AUTH_ROLE.USER)
  }

  /** Clear the user session, persisted data, and all permissions. */
  logout (): void {
    localSet(LOCAL_USER_KEYS.USER, null)
    this._setUser(null)
    this.clearPermissions()
    this._setAppRole?.(AUTH_ROLE.PASSENGER)
  }

  /**
   * Activate a temporary guest session.
   * Guest sessions are **not** persisted — they reset on next page load.
   */
  asGuest (partialUser: AppUser = {}): void {
    this._setUser({ ...partialUser })
    this._setAppRole?.(AUTH_ROLE.GUEST)
  }

  // ─── Auth strategy registry ─────────────────────────────────────────────────

  /**
   * Register an authentication strategy for a provider key.
   * Overwrites any existing strategy for that provider.
   * Returns `this` to allow chaining.
   *
   * @example
   * application.account
   *   .register('password', new PasswordStrategy())
   *   .register('wechat',   new WeChatStrategy())
   */
  register<P> (provider: AuthProvider, strategy: IAuthStrategy<P>): this {
    this._strategies.set(provider, strategy as IAuthStrategy)
    return this
  }

  /** Remove a previously registered strategy. */
  unregister (provider: AuthProvider): void {
    this._strategies.delete(provider)
  }

  /** Returns `true` if a strategy is registered for the given provider. */
  hasStrategy (provider: AuthProvider): boolean {
    return this._strategies.has(provider)
  }

  /** All currently registered provider keys. */
  get providers (): AuthProvider[] {
    return Array.from(this._strategies.keys())
  }

  /**
   * Execute login via the named provider strategy.
   * On success, activates a full authenticated session via `login()`.
   *
   * @throws If no strategy is registered for `provider`.
   * @throws If the strategy's `execute()` rejects (network error, wrong credentials, etc.).
   */
  async loginWith (provider: AuthProvider, params?: unknown): Promise<void> {
    const strategy = this._strategies.get(provider)
    if (!strategy) {
      throw new Error(`[AccountSubsystem] No strategy registered for provider: "${provider}"`)
    }
    const userData = await strategy.execute(params)
    this.login(userData)
  }

  // ─── Permissions ────────────────────────────────────────────────────────────

  /** Reactive check — returns `true` if the current user holds `permission`. */
  hasPermission (permission: Permission): boolean {
    return this._permissions().has(permission)
  }

  /** Replace the entire permission set (e.g. after loading a server profile). */
  loadPermissions (permissions: Permission[]): void {
    this._setPermissions(new Set(permissions))
  }

  /** Clear all permissions (called automatically on logout). */
  clearPermissions (): void {
    this._setPermissions(new Set<Permission>())
  }

  /** Raw reactive accessor — use when you need to reactively iterate the set. */
  permissions (): ReadonlySet<Permission> {
    return this._permissions()
  }
}
