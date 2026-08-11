# src/common — Framework-Agnostic Utilities

Pure TS helpers with **no SolidJS reactivity** (the one exception is `once.ts`-style tools that wrap Solid primitives; here everything is plain).

## Files
| File | Contents |
|---|---|
| `index.ts` | `uuidV4`, `random`, `randomStr`, `delay`, `nextLoop`, `leftTime`, `digitalTime`, `countLeftTime`, `groupNumber`, `shortNumber`, `base64ToFile`, `parseOrReturn`, `searchParam`, `min0`, … |
| `math.ts` | Decimal-safe `add/sub/mul/div/percent` (Ramda-based, handles precision) |
| `event.ts` | Global event bus: `on/off/emit/once` (wrapper over `lunzi/useEvent`) + `defaultEvent()` |
| `log.ts` | `logFor(badge)` scoped console logger; production logs disabled |
| `loop.ts` | Abortable poll loop: `loop({ run, check, count?, interval?, controller? })` |
| `predications.ts` | `isGT0`, `isLT0`, `isZero`, `isNumber`, `default0`, `useArray` |
| `worker.ts` | `createWorker(path)` — Worker RPC wrapper (`invoke/register/intercept/terminate`) |

## Conventions
- Pure, dependency-light utilities only. Import via `@/common` or `@/common/<file>`.
- Global ambient types (`VoidFn`, `AnyFn`, `Data`, `Key`, `InheritProps`, …) are declared in `src/types.d.ts` — they are available everywhere without imports.
- Do not put UI or page logic here.
