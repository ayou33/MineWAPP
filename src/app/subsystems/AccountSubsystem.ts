/**
 * AccountSubsystem — User session and permission management.
 *
 * Responsibilities:
 *  - Persist / restore the logged-in user across page refreshes.
 *  - Expose a reactive `current()` signal consumed by the rest of the app.
 *  - Notify the Application of system-level role changes (PASSENGER / GUEST / USER)
 *    via `app.setRole()` on every session transition.
 *  - Provide login / logout / guest-mode actions.
 *  - Maintain a reactive named-permission set for fine-grained UI control.
 *
 * Note: `AppUser` is intentionally free of role data. The system role (who is
 * using the app) lives on `Application.role`; account-level permissions are
 * managed separately via `loadPermissions`.
 */
import { LOCAL_USER_KEYS, USER_ROLE } from '@/config'
import { localGet, localSet } from 'lunzi'
import { Accessor, createSignal, Setter } from 'solid-js'
import type { AppBase, IAppSubsystem } from './types'

export type AppUser = {
  userId: string | number
  token: string
  /** A/B test group — determines feature flag eligibility. */
  group: number
  [key: string]: unknown
}

export type Permission = string

export class AccountSubsystem implements IAppSubsystem {
  readonly name = 'account'

  private readonly _user: Accessor<AppUser | null>
  private readonly _setUser: Setter<AppUser | null>

  private readonly _permissions: Accessor<ReadonlySet<Permission>>
  private readonly _setPermissions: Setter<ReadonlySet<Permission>>

  /** Stored during init() — used to push role changes up to the Application. */
  private _setAppRole: ((r: USER_ROLE) => void) | null = null

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
    // Synchronously restore role from localStorage so guards render correctly
    // on the first frame without a reactive re-evaluation.
    app.setRole(this._user() ? USER_ROLE.USER : USER_ROLE.PASSENGER)
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

  /** A/B test group number — `undefined` when no session is active. */
  group (): number | undefined {
    return this._user()?.group
  }

  // ─── Session write ──────────────────────────────────────────────────────────

  /** Persist user data and activate a full authenticated session. */
  login (userData: AppUser): void {
    localSet(LOCAL_USER_KEYS.USER, userData)
    this._setUser(userData)
    this._setAppRole?.(USER_ROLE.USER)
  }

  /** Clear the user session, persisted data, and all loaded permissions. */
  logout (): void {
    localSet(LOCAL_USER_KEYS.USER, null)
    this._setUser(null)
    this.clearPermissions()
    this._setAppRole?.(USER_ROLE.PASSENGER)
  }

  /**
   * Activate a temporary guest session.
   * Guest sessions are **not** persisted — they reset on next page load.
   */
  asGuest (partialUser: Partial<AppUser> = {}): void {
    this._setUser({
      userId: 'guest',
      token: '',
      group: 0,
      ...partialUser,
    })
    this._setAppRole?.(USER_ROLE.GUEST)
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
    this._setPermissions(new Set<string>())
  }

  /** Raw reactive accessor — use when you need to reactively iterate the set. */
  permissions (): ReadonlySet<Permission> {
    return this._permissions()
  }
}
