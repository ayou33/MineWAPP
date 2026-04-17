/**
 * Application singleton — the single entry point for all top-level app state.
 *
 * Compose behaviour by passing subsystems to `createApplication`.
 * Every subsystem is accessible as a typed property on the returned instance.
 * Core context (UA, platform, hybrid mode, etc.) is always available directly
 * on the instance without a subsystem wrapper.
 *
 * @see AppCore.ts   — Application class + createApplication factory
 * @see subsystems/  — Individual subsystem implementations
 *
 * Extending the app:
 *   1. Create a new class in `subsystems/` that implements `IAppSubsystem`.
 *   2. Add it to the `createApplication` call below.
 *   3. The new subsystem is immediately accessible as `application.<key>`.
 */
import { createApplication } from './AppCore'
import { AccountSubsystem, BridgeSubsystem, ConfigSubsystem, NetworkSubsystem, ReportSubsystem } from '@/app/subsystems'

export type { AppUser, AuthProvider, IAuthStrategy, Permission } from './subsystems/AccountSubsystem'
export type { ConfigOptions } from './subsystems/ConfigSubsystem'
export type { ReportOptions } from './subsystems/ReportSubsystem'
export type { ApplicationInstance } from './AppCore'
export type { ISocket, SocketState } from './subsystems/SocketSubsystem'
export type { AppContext } from './types'

// Instantiate subsystems that have inter-references before passing to createApplication,
// so lazy accessors can capture the instance directly without circular imports.
const account = new AccountSubsystem()

const application = createApplication({
  /** Hybrid JSBridge: RPC calls to native iOS/Android host. */
  bridge: new BridgeSubsystem('bridge', 'init'),

  /** Remote config and feature flags — loaded before other subsystems. */
  config: new ConfigSubsystem({
    // url: '/api/config/remote.json',  // uncomment to enable remote config
    defaults: {},
  }),

  /** User session, auth strategies and permissions — login / logout / guest. */
  account,

  /** Network connectivity and page visibility reactive state. */
  network: new NetworkSubsystem(),

  /** Error capture, analytics events, batched tracking. */
  report: new ReportSubsystem({
    // Lazily reads the userId at track-time — no coupling to AccountSubsystem type.
    getUserId: () => account.current()?.['userId'],
  }),

  // ── Socket connections ─────────────────────────────────────────────────────
  // Uncomment and pass your ISocket adapter(s) to enable.
  // autoConnect defaults to false — call connect() manually after login.
  //
  // Single connection (name defaults to 'main'):
  //   socket: new SocketSubsystem(new MySocketAdapter('wss://example.com')),
  //
  // Multiple named connections:
  //   socket: new SocketSubsystem({
  //     main:  new MySocketAdapter('wss://example.com/chat'),
  //     trade: new MySocketAdapter('wss://example.com/trade'),
  //   }),
})

export default application
