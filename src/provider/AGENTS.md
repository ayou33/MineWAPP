# src/provider — Context Providers

| File | Purpose |
|---|---|
| `scopedPage/ScopedPage.tsx` | Per-page lifecycle: request cancel, toast/popup label, namespaced `on`/`emit`, local Suspense |
| `scopedPage/PageGuard.tsx` | Auth redirect + 403 screen |
| `Default.tsx` | Fallback value renderer (`--` / NaN for numbers) |
| `Scroller.tsx` | Scroll container with bottom-threshold load-more + scroll-position restore (KeepAlive) |
| `Touchable.tsx` | Cross-platform tap/hold/release (`is` polymorphic; `Touchable.button/.span`) |

## Conventions
- `ScopedPage` children must be a `ValidComponent` **function reference**, never JSX.
- Use `usePageContext()` inside pages instead of importing these providers directly.
- `Touchable` picks mouse vs touch events via `isPC`; honors `holdThreshold`.

## Pitfalls
- `Scroller` `ref` is a function callback (`(el) => void`) — object refs are not supported; the root also exposes `data-scroll-id`.
- `Touchable`: cancel listener is added per pointer start and only removed on cancel — watch for leaks on rapid taps.
- `PageGuard` reads `application.role()` reactively — keep the role ladder semantics (`PASSENGER < GUEST < USER < AUTHED < ADMIN`).
