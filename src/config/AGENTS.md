# src/config — Constants & Environment

Single source of truth for project configuration. Barrel `index.ts` re-exports everything from `@/config`.

## File map
| File | Contents |
|---|---|
| `const.ts` | `TipType`, `TipPosition`, `AUTH_ROLE` (PASSENGER/GUEST/USER/AUTHED/ADMIN), `AUTH_PATH` |
| `keys.ts` | `EVENTS` (core LOGIN/LOGOUT/TOKEN_ERROR/WAKEUP + project CONSUME/BALANCE_CHANGED), `SESSION_KEYS`, `LOCAL_USER_KEYS`, `LOCAL_SYS_KEYS`, `SIGNALS` |
| `defaults.ts` | `DEFAULT_PACKAGE_NAME`, `DEFAULT_MARKET`, `DEFAULT_APP_VERSION`, domain constants (`MONEY_MULTIPLIER`) |
| `numbers.ts` | Pure numeric constants (`ONE_SECOND`, `ONE_MINUTE`, `ZERO`, `PRIORITY`, …) |
| `static.ts` | Runtime env detection: `isAndroid/isIOS/isPC/isDev/isProd/isTest`, `brand` |
| `locale.ts` | `locales` (BCP-47 array), `defaultLocale`, `readSystemLang()` |
| `server.env.ts` | `api` base URL per `NODE_ENV` (override with `VITE_API_BASE`) |
| `index.ts` | Barrel (re-export + `server`) |

## Conventions
- Domain constants go in `defaults.ts`; pure numerics in `numbers.ts`; keys/events in `keys.ts`.
- `EVENTS` core names must never change (infrastructure depends on them).
- `static.ts` reads `navigator` at module scope — browser only.
- Add new locales to `locale.ts` (`locales` + `defaultLocale`) and add JSON under `public/lang/`.
