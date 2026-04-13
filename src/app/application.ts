/**
 * Application singleton — the single entry point for all top-level app state.
 *
 * Compose behaviour by passing subsystems to `createApplication`.
 * Every subsystem is accessible as a typed property on the returned instance.
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
import { AccountSubsystem, ApiSchemaSubsystem, BridgeSubsystem, ReportSubsystem } from '@/app/subsystems'

export type { AppUser } from './subsystems/AccountSubsystem'
export type { ApplicationInstance } from './AppCore'
// Export ISocket so consumers can write their own adapters without importing
// from the subsystem path directly.
export type { ISocket, SocketState } from './subsystems/SocketSubsystem'

const application = createApplication({
  /** User session, system role, permissions — login / logout / guest. */
  account: new AccountSubsystem(),

  /** Field-mapping tables: decode server payloads, encode request params. */
  schema: new ApiSchemaSubsystem(),

  /** Hybrid JSBridge: RPC calls to native iOS/Android host. */
  bridge: new BridgeSubsystem(),

  /** Error capture, analytics events, batched tracking. */
  report: new ReportSubsystem(),

  // ── Socket connections ─────────────────────────────────────────────────────
  // Uncomment and pass your ISocket adapter(s) to enable.
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
