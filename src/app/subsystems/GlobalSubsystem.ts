/**
 * GlobalSubsystem — Auto-discovery and registry for cross-module global responders.
 *
 * Responsibilities:
 *  - At init time, iterate a pre-loaded `import.meta.glob` result and register
 *    every `GlobalResponder` exported from matching global files.
 *  - Expose `execute(name)` so any part of the app (e.g. Dashboard) can trigger
 *    a responder without knowing which module implements it.
 *  - Expose `all()` and `find(name)` for UI enumeration (quick-action panels, etc).
 *  - Allow manual `register()` for programmatic registration beyond file discovery.
 *
 * Convention — global files must:
 *  - Be named matching `pattern` (e.g. `*.global.ts`) inside `scope`.
 *  - Export a `default` of type `GlobalResponder | GlobalResponder[]`.
 *
 * Usage:
 * ```ts
 * // 1. Register in application.ts:
 * global: new GlobalSubsystem(
 *   import.meta.glob('/src/modules/**\/*.global.ts', { eager: true })
 * )
 *
 * // 2. Execute anywhere:
 * application.global.execute('contract:create')
 *
 * // 3. List for UI:
 * application.global.all()   // GlobalResponder[]
 * ```
 *
 * Priority: -10 — after ConfigSubsystem (-50), before AccountSubsystem (0).
 */
import type { JSX } from 'solid-js'
import type { IAppSubsystem } from '../types'

// ─── Responder type ──────────────────────────────────────────────────────────

/**
 * A single named action that can be invoked globally.
 * Defined in a module's `*.global.ts` and discovered automatically.
 */
export type GlobalResponder = {
  /** Optional permission code — consumers can gate display/execution on this. */
  permissionCode?: string
  /** Unique action identifier, e.g. `'contract:create'`. */
  code: string
  /** Human-readable label, e.g. `'录入主合同'`. */
  desc?: string
  /** MDI icon name, e.g. `'file-plus'`. */
  icon?: string
  /** Optional inline render — e.g. a quick-entry form card for the dashboard. */
  render?: () => JSX.Element
  /** The action to perform. May lazy-load heavy components internally. */
  handler: () => Promise<unknown>
}

// ─── Module shape ─────────────────────────────────────────────────────────────

/** Expected shape of a `*.global.ts` module default export. */
type GlobalResponderModule = {
  default?: GlobalResponder | GlobalResponder[]
}

// ─── Options ──────────────────────────────────────────────────────────────────

/**
 * Pre-loaded glob result — call `import.meta.glob(...)` at the `application.ts`
 * level (Vite requires a static string literal at the call site).
 *
 * @example
 * import.meta.glob('/src/modules/**\/*.global.ts', { eager: true })
 */
export type GlobalModules = Record<string, unknown>

// ─── Subsystem ────────────────────────────────────────────────────────────────

export class GlobalSubsystem implements IAppSubsystem {
  readonly name = 'global'
  /** Run after BridgeSubsystem (-100) and ConfigSubsystem (-50), before AccountSubsystem (0). */
  readonly priority = -10

  private readonly _rawModules: GlobalModules
  private readonly _registry = new Map<string, GlobalResponder>()

  constructor (modules: GlobalModules) {
    this._rawModules = modules
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  init (): void {
    let fileCount = 0
    let responderCount = 0

    for (const [path, mod] of Object.entries(this._rawModules)) {
      const resolved = mod as GlobalResponderModule
      const entries: GlobalResponder[] = Array.isArray(resolved.default)
        ? resolved.default
        : resolved.default !== null && resolved.default !== undefined
          ? [resolved.default]
          : []

      if (entries.length === 0) {
        if (import.meta.env.DEV) {
          console.warn(`[GlobalSubsystem] No responders exported from ${path}`)
        }
        continue
      }

      for (const responder of entries) {
        if (!responder?.code) {
          console.warn(`[GlobalSubsystem] Skipping unnamed responder in ${path}`)
          continue
        }
        if (this._registry.has(responder.code) && import.meta.env.DEV) {
          console.warn(`[GlobalSubsystem] Duplicate responder "${responder.code}" — overwriting (${path})`)
        }
        this._registry.set(responder.code, responder)
        responderCount++
      }
      fileCount++
    }

    if (import.meta.env.DEV) {
      console.debug(`[GlobalSubsystem] Registered ${responderCount} responder(s) from ${fileCount} file(s)`)
    }
  }

  dispose (): void {
    this._registry.clear()
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Register a responder manually — useful for programmatic registration
   * that does not follow the file-discovery convention.
   */
  register (responder: GlobalResponder): void {
    this._registry.set(responder.code, responder)
  }

  /**
   * Execute a responder by code.
   * Returns the handler's Promise, or `undefined` when no responder is found.
   */
  execute (code: string): Promise<unknown> | undefined {
    const responder = this._registry.get(code)
    if (!responder) {
      if (import.meta.env.DEV) {
        console.warn(`[GlobalSubsystem] No responder registered for "${code}"`)
      }
      return undefined
    }
    return responder.handler()
  }

  /**
   * Look up a single responder by code without executing it.
   * Useful for rendering permission-gated buttons.
   */
  find (code: string): GlobalResponder | undefined {
    return this._registry.get(code)
  }

  /**
   * Return all registered responders.
   * Useful for dynamically rendering quick-action lists in the dashboard.
   */
  all (): GlobalResponder[] {
    return Array.from(this._registry.values())
  }
}
