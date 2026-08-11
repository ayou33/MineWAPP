# src/tools/mock — Dev Mock System

Lightweight dev-only API interception.

## Files
| File | Role |
|---|---|
| `index.ts` | `defineMock(path, handler, options?)`, `getMockEntry(path)`, `simulateDelay(range?)`, `MOCK_PREFIX` (`$`) |
| `mock.setup.ts` | Eagerly imports `*.mock.ts` files in dev (via `import.meta.glob`) |

## Usage
```ts
// foo.api.ts
export const touchUser = get<User, AuthParams>('$/api/user/login/jsonp')
// foo.mock.ts
defineMock('/api/user/login/jsonp', params => ({ userId: 1, nickname: 'Dev User' }), { delay: [200, 800] })
```
Handlers can be async; `throw` to simulate failures.

## Pitfalls
- `mock.setup.ts` globs `../../modules/**/*.mock.ts` — keep it in sync if the modules directory is ever renamed again.
- Mocks only load when `isDev` (guarded in `src/index.tsx`).
