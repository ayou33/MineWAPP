# src/hooks — Shared SolidJS Hooks

| File | Purpose |
|---|---|
| `useRequest.ts` | Wrap an API fn with `loading` signal + label-based cancel on unmount: `const [fetch, loading] = useRequest(pageId)(fetchFoo)` |
| `useTimer.ts` | Page-scoped `interval` / `delay` (auto-cleared) + countdown `cd(duration, opts)` → `[left, start, stop]` |
| `usePageContext.ts` | Access `ScopedPage` context (`request/toast/popup/interval/delay/on/emit`); standalone fallback |
| `useBoolean.ts` | `[state, { setTrue, setFalse, toggle, set }]` + optional change callback |
| `useBack.ts` | Back navigation via `location.state.from` or `history.back()` |
| `useAuthenticate.ts` | Redirect to `AUTH_PATH` when role < required |
| `useAppVisibility.ts` | `visibilitychange` hooks (`onVisible`/`onHidden`) |

## Conventions
- Hooks own their cleanup via `onCleanup` — never leak timers/listeners.
- `useRequest` relies on the request factory accepting `{ id, label }` options (see `src/tools/request/`).

## Pitfalls
- `usePageContext` fallback must not register the listener twice (fixed — push the `off` handle returned by `on`).
- `useAuthenticate` navigates both synchronously during render and in an effect — prefer the `PageGuard` pattern in pages.
