# src/app/subsystems — Application Subsystems

Each subsystem implements `IAppSubsystem` (`name`, optional `priority`, `init?`, `dispose?`) from `../types.ts`.

## Priority tiers
| priority | subsystem | responsibility |
|---|---|---|
| -100 | `bridge` | Native JSBridge handshake → `isHybrid` / `appVersion` |
| -50  | `config` | Remote config / feature flags (`get/set/delete/has/snapshot`) |
| -10  | `global` | Cross-module responder registry from `*.global.ts` |
| 0 (default) | `account`, `network`, `report`, `socket` | session+permissions / connectivity / analytics / WebSocket manager |

## File map
| File | Public API (subset) |
|---|---|
| `AccountSubsystem.ts` | `current()`, `login()`, `logout()`, `asGuest()`, `loginWith()`, `register()`, `loadPermissions()`, `hasPermission()` |
| `BridgeSubsystem.ts` | `call(method, params)`, `on(method, handler)`, `isAvailable` |
| `ConfigSubsystem.ts` | `get<T>(k, fb?)`, `set`, `delete`, `has`, `snapshot` |
| `GlobalSubsystem.ts` | `execute(code)`, `find(code)`, `all()`, `register(responder)` |
| `NetworkSubsystem.ts` | `isOnline()`, `isVisible()`, `onConnectionChange()`, `onVisibilityChange()` |
| `ReportSubsystem.ts` | `track(name, params)`, `captureError(err, ctx)`, `flush()` |
| `SocketSubsystem.ts` | `add(url|opts)`, `connect()`, `disconnect()`, `send()`, `on/off`, `SocketState` |
| `bridge/` | Native iOS/Android bridge stubs (ObjC/Swift/Kotlin/Java) + `bridge/index.ts` re-export |

## Conventions
- **Add a subsystem**: 1) implement `IAppSubsystem` here; 2) register in `../application.ts`; 3) use `application.<key>`.
- Use `app.use<T>(name)` inside a subsystem to reach peers — avoids circular imports. Prefer `app.onRole` / `app.onLocale` for reacting to session/locale changes.
- Reactive state: SolidJS `createSignal`/`createStore`. Keep listeners in bound fields so `dispose()` can remove the exact handlers.
- `init()` may be async; failures should be contained (e.g. `ConfigSubsystem` catches fetch errors and falls back to defaults).
- Keep subsystems framework-agnostic where possible — they are instantiated before the Solid root renders.
