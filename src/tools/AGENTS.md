# src/tools — Request Layer, Mock System, Utilities

| Folder/File | Purpose |
|---|---|
| `request/` | `get`/`post` factories, axios + Web Worker transports, `receive` (see its own AGENTS.md) |
| `mock/` | Dev mock registry: `defineMock`, `getMockEntry`, `simulateDelay`, `MOCK_PREFIX` (`$`) |
| `once.ts` | `once(onValued, valueAccessor, ifValued?)` — call a callback when a signal first becomes valued |

## Conventions
- Business code uses `@/tools/request` factories; never import `axios` directly.
- Mock endpoints: prefix API path with `$` in `api.ts` and register `defineMock('/api/…', handler)` in a `*.mock.ts` file.
- `once.ts` is generic (works on any accessor, defaults to "not nil").
