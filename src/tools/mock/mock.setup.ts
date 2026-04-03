/**
 * Eagerly loads all `*.mock.ts` files under `src/module/` so that their
 * `defineMock(...)` side-effects run before any API requests are made.
 *
 * This module is only imported in dev (guarded by `isDev` in src/index.tsx).
 */

const modules = import.meta.glob('../../module/**/*.mock.ts', { eager: true })

console.info(`[mock] Loaded ${Object.keys(modules).length} mock file(s):`, Object.keys(modules))
