# src/app — Application Singleton & Subsystem Boot

Owns the app singleton, runtime context, and the priority-ordered boot sequence.

## Files
| File | Role |
|---|---|
| `application.ts` | **Wiring** — `createApplication({ … })`; edit to register subsystems |
| `AppCore.ts` | `Application` class + `createApplication()`; boot orchestration (**infra, do not edit**) |
| `types.ts` | `AppBase`, `IAppSubsystem`, `AppContext` contracts |
| `webId.ts` | Stable browser fingerprint (`resolveWebId()`, MurmurHash3 64-bit, persisted) |
| `BreakNews.tsx` | Optional top banner (demo) |
| `subsystems/` | Individual subsystems (see its own AGENTS.md) |

## Conventions
- Read context via `application.context()` or direct props (`isWeb/isPC/isIOS/isAndroid/isHybrid/appVersion/webId`).
- Subsystems are attached as typed properties (`application.account`, `application.bridge`, …) — never reach into internals.
- Subsystem boot order = ascending `priority`; ties = registration order. Bridge context (`isAvailable` + `appVersion`) is duck-typed after each init so later subsystems see `isHybrid`.
- Do **not** edit `AppCore.ts` for project concerns; put new subsystems in `subsystems/` and register them in `application.ts`.

## Pitfalls
- `AppCore.ts` reads `process.env.NODE_ENV` and `import.meta.env.*` at construction — keep all platform detection here.
- `dispose()` tears down all subsystems; used in tests/SSR only.
