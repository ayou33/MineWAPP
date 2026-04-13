/**
 * Core interfaces for the Application subsystem architecture.
 *
 * Every subsystem implements `IAppSubsystem<AppT>` where `AppT` is the
 * minimal slice of the application the subsystem needs during `init`.
 * This keeps coupling explicit and type-safe without a circular dependency.
 */
import type { Accessor } from 'solid-js'
import type { USER_ROLE } from '@/config'

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
