# src/modules — Feature Modules

Every business feature lives here as a self-contained module consumed by a thin page wrapper in `src/pages/`.

## Current modules
| Module | Purpose |
|---|---|
| `home/` | Landing page (i18n demo) |
| `auth/` | Login page (mock login + `EVENTS.LOGIN`) |
| `about/` | About page (toast demo) |
| `example/` | **Component showcase** — Table, SearchBox, DateTimePicker, form demos; the de-facto reference for component usage |

## Module anatomy
```
src/modules/foo/
├── Foo.index.tsx   # default export = page component (passed to ScopedPage)
├── foo.api.ts      # get/post API defs (never axios)
├── foo.helper.ts   # optional helpers
├── foo.global.ts   # optional GlobalSubsystem responders (auto-discovered)
├── foo.mock.ts     # optional dev mocks via defineMock
├── store/          # optional: store.ts + actions.ts
├── components/     # optional module-local components
└── hooks/          # optional module-local hooks
```

## Conventions
- Module entry must be a component **function reference**, not JSX, when passed to `ScopedPage`.
- Register any global state slice in `src/store/store.config.ts`.
- `*.global.ts` files export `GlobalResponder | GlobalResponder[]` (discovered by `GlobalSubsystem`).
- `*.mock.ts` files call `defineMock(...)` at module scope; loaded eagerly in dev only.

## Pitfalls
- `src/tools/mock/mock.setup.ts` still globs `../../module/…` (stale after the rename to `modules`) — Known Issue #3.
