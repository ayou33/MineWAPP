# src/components — Reusable UI

Tailwind-first, MD3-styled, SolidJS functional components. Never import axios / business logic here.

## Files & clusters
| Path | Purpose |
|---|---|
| `Button.tsx` | Loading-aware button (min 500 ms spinner) built on `Touchable.button` |
| `Icon.tsx` | Iconify wrapper (`name`, `set` — default `line-md`) |
| `Image.tsx` | Preloader + fallback + `object-fit` image |
| `Spin.tsx`, `Page.tsx`, `TabPage.tsx` | Spinner / system-page layout / tabbed layout |
| `DropdownMenu.tsx` | Portal popover menu (render-prop trigger, Escape/outside close) |
| `RenderFallback.tsx` | Global error boundary fallback (copy stack, home, reset) |
| `form/` | `Input`, `PasswordInput`, `Select`, `DropdownSelect`, `DropdownSelector`, `SearchBox`, `FormItem`, `ButtonGroup` |
| `tips/` | `Tips.tsx` (queue) + `Tip.tsx` (self-managed animation) |
| `popups/` | `Popups.tsx` (TransitionGroup queue), `Popup`, `PCPopupShell`, `ConfirmPopup`, `FormPopup` |
| `loading/` | `Loading.app/page/content/data/component`, `SkeletonBar` |
| `DateTimePicker/` | Wheel picker (`DateTimePicker`, `WheelColumn`, `showDateTimePicker`) |

## Conventions
- Style with Tailwind utilities + CSS variables (`var(--md-*)`, `var(--c-*)`, semantic z-index classes). No `*.module.scss`.
- Use `classnames` (aliased `classNames`) for conditional classes.
- Page-context features: `usePageContext()` → `toast`, `popup`, `request`, `interval`, `delay`, `on`, `emit`.
- **i18n**: route visible strings through `t()` / `I18n`. Several components still have hardcoded Chinese (see root AGENTS Known Issues) — fix when touched.
- `Button` defaults to `type="button"`; pass `type="submit"` / `"reset"` explicitly when needed.

## Pitfalls
- Do not add dead props to `<Button>` (e.g. `confirmable`) — they leak to the DOM.
- Keep animation timing derived from `--transition-duration`, never hardcode.
