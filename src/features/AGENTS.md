# src/features — Feature Modules

Each folder is self-contained. **Core files** (marked "core, do not edit") are project-agnostic infrastructure; **config files** are the only project-specific touch points.

## Folders
| Folder | Purpose | Project config touch point |
|---|---|---|
| `abTest/` | A/B feature flags (group + platform/version gates) | `feature.config.ts` |
| `form/` | Headless form engine (validation, cascade, relations, bind helpers) | none (used directly) |
| `i18n/` | `t()` / `I18n` + JSON dictionary loading | `config.ts`, `public/lang/*.json` |
| `keepAlive/` | Route-level component caching (LRU) | none |
| `loadMore/` | Infinite-scroll hook (`useLoadMore`) | none |
| `pageTransition/` | Forward-navigation animation helpers | none |
| `table/` | Data table engine + UI (see its own AGENTS.md) | none |
| `richtext/` | Quill 2 rich-text editor | `richtext.css` |
| `dateFormat.ts` | `Date.prototype.format2(pattern)` extension | none |

## Conventions
- Keep core engines untouched; extend via config files or composition.
- Feature components must be page-agnostic — page wiring happens in `src/pages/` + `src/modules/`.
- i18n dictionaries are lazily loaded per locale; always use `t()` for labels.
