/**
 * ConfigSubsystem — Remote configuration and feature-flag loader.
 *
 * Responsibilities:
 *  - Fetch a JSON config from a remote URL during boot (before other subsystems).
 *  - Merge remote values with static defaults provided at construction time.
 *  - Provide a typed `get<T>(key, fallback?)` accessor used throughout the app.
 *  - Allow runtime overrides via `set(key, value)` (e.g. from a JSBridge push).
 *
 * Priority: -50 — runs after BridgeSubsystem (-100) so `app.isHybrid` is known,
 * but before AccountSubsystem (0) so feature flags are available during login flows.
 *
 * Usage:
 * ```ts
 * // 1. Register in application.ts:
 * config: new ConfigSubsystem({
 *   url: '/api/config/remote.json',       // optional remote endpoint
 *   defaults: {
 *     maintenance_mode: false,
 *     max_upload_mb: 10,
 *   },
 * })
 *
 * // 2. Read anywhere:
 * application.config.get<boolean>('maintenance_mode')         // false
 * application.config.get<number>('max_upload_mb', 5)          // 10 (remote wins)
 * application.config.get<string>('unknown_key', 'fallback')   // 'fallback'
 *
 * // 3. Runtime override (e.g. from a native bridge push):
 * application.config.set('maintenance_mode', true)
 * ```
 */
import type { IAppSubsystem } from '../types'

export type ConfigOptions = {
  /**
   * URL of a remote JSON endpoint to fetch during boot.
   * The response must be a flat `Record<string, unknown>` object.
   * Network failures are silently caught — defaults are used as fallback.
   */
  url?: string
  /**
   * Static default values. Remote values take precedence over these.
   * Set all your known config keys here so `get()` always has a baseline.
   */
  defaults?: Record<string, unknown>
}

export class ConfigSubsystem implements IAppSubsystem {
  readonly name = 'config'
  /** Run after bridge (-100) but before all other subsystems (0). */
  readonly priority = -50

  private readonly _url: string | undefined
  /**
   * Static baseline values supplied at construction time.
   * Never mutated after construction — `delete()` cannot erase a default.
   */
  private readonly _defaults: Map<string, unknown>
  /**
   * Runtime layer: remote config fetched during `init()` plus any values
   * pushed via `set()`. Takes precedence over `_defaults`.
   * `delete()` only removes entries from this layer, revealing the default again.
   */
  private readonly _overrides = new Map<string, unknown>()

  constructor (options: ConfigOptions = {}) {
    this._url = options.url
    this._defaults = new Map(Object.entries(options.defaults ?? {}))
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async init (): Promise<void> {
    if (!this._url) return
    try {
      const resp = await fetch(this._url)
      if (!resp.ok) {
        console.warn(`[ConfigSubsystem] Failed to load remote config (${resp.status}), using defaults.`)
        return
      }
      const remote: Record<string, unknown> = await resp.json()
      for (const [key, value] of Object.entries(remote)) {
        this._overrides.set(key, value)
      }
    } catch {
      console.warn('[ConfigSubsystem] Remote config fetch failed, using defaults.')
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Get a config value by key.
   * Runtime overrides take precedence over constructor defaults.
   * Returns `fallback` (or `undefined`) when the key is absent from both layers.
   *
   * @example
   * config.get<boolean>('maintenance_mode', false)
   * config.get<string[]>('allowed_regions')
   */
  get<T> (key: string, fallback?: T): T {
    if (this._overrides.has(key)) return this._overrides.get(key) as T
    if (this._defaults.has(key)) return this._defaults.get(key) as T
    return fallback as T
  }

  /**
   * Set a runtime override.
   * Writes to the override layer only — the default value is preserved and
   * will re-surface if this override is later removed with `delete()`.
   */
  set (key: string, value: unknown): void {
    this._overrides.set(key, value)
  }

  /**
   * Remove a runtime override, revealing the constructor default (if any).
   * Has no effect on values that were only ever set as defaults.
   */
  delete (key: string): void {
    this._overrides.delete(key)
  }

  /** `true` if the key exists in either the defaults or override layer. */
  has (key: string): boolean {
    return this._overrides.has(key) || this._defaults.has(key)
  }

  /** Returns a plain object snapshot merging defaults and overrides (overrides win). */
  snapshot (): Record<string, unknown> {
    return Object.fromEntries([...this._defaults, ...this._overrides])
  }
}
