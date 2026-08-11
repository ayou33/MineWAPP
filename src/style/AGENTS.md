# src/style — Global Styles

| File | Role |
|---|---|
| `var.scss` | MD3 design tokens: `--md-*` color roles, `--c-*` semantic tokens, motion (`--transition-duration`, `--ease-*`), dark theme `.dark` overrides |
| `transition.scss` | All animation classes (`.tip-*`, `.popup-*`, `.rise-*`, `.fade`) — use CSS variables, never SCSS vars |
| `tailwind.css` | TailwindCSS v4 entry: `@theme` + `@theme inline` (maps `--c-*` → utilities), semantic z-index scale, font sizes |
| `index.scss` | `@use "./var.scss"` + `@use "./transition.scss"`, fonts (HarmonyOS), base reset, hidden scrollbars |
| `font/` | HarmonyOS Sans woff2 files |

## Conventions
- Tailwind processes **`.css` only** — never `@import "tailwindcss"` in SCSS.
- Component styling: Tailwind utilities first; `*.module.css` only for keyframes/pseudo/third-party overrides.
- Use semantic z-index classes (`z-popup`, `z-dropdown`, `z-system`, …) — no raw `z-[N]` in modules.
- Motion constants read from `--transition-duration` etc.; change them globally affects tips/popups/transitions.
- Dark mode: toggle `dark` class on `<html>`.

## Theming — how to re-skin for a new project
- **Single source of truth is `var.scss`**: Layer 1 `--md-*` (MD3 roles), Layer 2 `--c-*` (semantic tokens, mostly referencing roles), `--state-*`. Re-theme = override these (light + `.dark`).
- **Never hardcode hex/rgba in components or modules.** Use `var(--c-*)` / `var(--md-*)` inline, or Tailwind utilities generated in `tailwind.css` (`bg-c-surface`, `text-md-primary`, …).
- **Legacy palette in `tailwind.css` `@theme` now references tokens** (`--color-blue: var(--md-primary)`, `--color-gray: var(--c-text-muted)`, …) so old classes like `bg-blue` / `text-gray` follow re-theming. Non-1:1 legacy shades (`blue-3lighter`, `green-darker`, …) stay literal — migrate them to token classes when touched.
- **JS-side colors** (charts, i18n `colorful`, canvas): reference `var(--md-*)` in inline styles when possible (they resolve in the DOM); otherwise read via `getComputedStyle`.
- Remaining intentional literals: `#fff` text on custom-colored buttons, Table pinned-column shadows (neutral black), `webId.ts` fingerprint canvas (must stay fixed).
