# src/tools/request — Request Layer

Core request infrastructure with a **single project-config file**.

## Files
| File | Role |
|---|---|
| `index.ts` | `get`/`post` factories via `receive(request, parser)`; mock interception in dev; normalized error `{ data, url, code, message }` (**infra, do not edit**) |
| `request.config.ts` | **Project config** — `ERROR_CODE`, `ServerResponse<T>`, `Pagination`, `ApiPath`, `MockPath`, `buildCommonParams`, `responseParser` |
| `request.axios.ts` | Axios transport + interceptor merging `buildCommonParams()` (infra) |
| `request.worker.ts` | Web Worker transport via `createWorker('/worker/fetch.js')` + `buildCommonParams` intercept (infra) |
| `common.ts` | `makeFormData` helper |

## How it works
1. `receive` returns a curried request fn: `(url, config?) => (data?, transformer?) => Promise<R>`.
2. URLs starting with `$` are mockable in dev (`getMockEntry` + `simulateDelay`); in prod `$` is stripped and the real request runs.
3. Worker transport is used when available, axios as fallback; `stateFetch` provides priority queue + caching (`expireIn`).
4. `responseParser` unwraps `ServerResponse<T>`; `.json` URLs bypass the envelope; `TOKEN_EXPIRED` emits `EVENTS.TOKEN_ERROR` (silent for GUEST role).

## Conventions
- API defs: `export const fetchFoo = get<FooData, FooParams>('/api/foo/data')`.
- Customise **only** `request.config.ts` for project concerns.
- Do not import axios in modules/components.
