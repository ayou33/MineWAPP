/**
 * ApiSchemaSubsystem — Field-mapping and response decoding.
 *
 * ⚠️  This is a **standalone utility**, not an Application subsystem.
 *     Instantiate it directly where needed, or integrate its logic into
 *     `request.config.ts` → `responseParser` for global decoding.
 *
 * Responsibilities:
 *  - Store per-namespace field-name translation tables (server key → app key).
 *  - Decode raw server payloads into app-friendly shapes.
 *  - Encode app-side objects back into the wire format before sending.
 *  - Optionally hydrate mapping tables from a remote JSON endpoint.
 *
 * Usage:
 *  ```ts
 *  const schema = new ApiSchemaSubsystem()
 *
 *  // Register a mapping:
 *  schema.register('order', { orderId: 'id', orderStatus: 'status' })
 *
 *  // Decode a server response:
 *  const order = schema.decode<Order>('order', rawPayload)
 *
 *  // Load all mappings from a remote config file:
 *  await schema.loadFromUrl('/api/schema/field-map.json')
 *  ```
 */
import type { IAppSubsystem } from '../types'

export type FieldMap = Record<string, string>

export class ApiSchemaSubsystem {
  // Standalone utility — no lifecycle management needed.
  readonly name = 'schema'

  private readonly _maps = new Map<string, FieldMap>()

  // ─── Registration ─────────────────────────────────────────────────────────

  /** Register (or replace) a field mapping for the given namespace. */
  register (namespace: string, fieldMap: FieldMap): void {
    this._maps.set(namespace, fieldMap)
  }

  // ─── Transform ────────────────────────────────────────────────────────────

  /**
   * Decode a raw server object by renaming its keys using the registered map.
   * Keys not present in the map are passed through unchanged.
   */
  decode<T extends Record<string, unknown>> (
    namespace: string,
    raw: Record<string, unknown>,
  ): T {
    const map = this._maps.get(namespace)
    if (!map) return raw as T

    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [map[k] ?? k, v]),
    ) as T
  }

  /**
   * Encode an app-side object by reversing the registered mapping before
   * sending it to the server.
   */
  encode<T extends Record<string, unknown>> (
    namespace: string,
    data: T,
  ): Record<string, unknown> {
    const map = this._maps.get(namespace)
    if (!map) return data as Record<string, unknown>

    const reverse = Object.fromEntries(
      Object.entries(map).map(([serverKey, appKey]) => [appKey, serverKey]),
    )

    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [reverse[k] ?? k, v]),
    )
  }

  // ─── Remote loading ────────────────────────────────────────────────────────

  /**
   * Fetch a JSON file whose top-level keys are namespace names and values are
   * `FieldMap` objects, then register all entries.
   *
   * Expected shape:
   * ```json
   * {
   *   "order":   { "orderId": "id",  "orderStatus": "status" },
   *   "product": { "productName": "name" }
   * }
   * ```
   */
  async loadFromUrl (url: string): Promise<void> {
    const resp = await fetch(url)
    if (!resp.ok) {
      throw new Error(`[ApiSchemaSubsystem] Failed to load schema from ${url}: ${resp.status}`)
    }
    const config: Record<string, FieldMap> = await resp.json()
    for (const [namespace, fieldMap] of Object.entries(config)) {
      this.register(namespace, fieldMap)
    }
  }
}
