/**
 * File: mock/index.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 *
 * Lightweight mock system for dev-only API interception.
 *
 * Usage:
 *   1. Mark an endpoint with `$` prefix in the api.ts file:
 *      export const touchUser = get<User, AuthParams>('$/api/user/login/jsonp')
 *
 *   2. Register a handler in a sibling `*.mock.ts` file:
 *      defineMock('/api/user/login/jsonp', () => ({ userId: 1, nickname: 'Dev User', ... }))
 *
 *   3. The mock is auto-loaded in dev via `mock.setup.ts` → `src/index.tsx`.
 *      In production the `$` is stripped and the real request is sent as normal.
 */

export const MOCK_PREFIX = '$'

export type MockHandler<R, P = unknown> = (params: P) => R | Promise<R>

export type MockOptions = {
  /** Delay range in milliseconds [min, max]. Defaults to [200, 800]. */
  delay?: [min: number, max: number]
}

type MockEntry = {
  handler: MockHandler<unknown, unknown>
  options: MockOptions
}

const registry = new Map<string, MockEntry>()

const DELAY_MIN_DEFAULT = 200
const DELAY_MAX_DEFAULT = 800
const DEFAULT_DELAY: [number, number] = [DELAY_MIN_DEFAULT, DELAY_MAX_DEFAULT]

/**
 * Register a mock handler for an API path.
 * @param path    The real API path (without the `$` prefix), e.g. `/api/user/login/jsonp`
 * @param handler Function returning mock data. Can be async; throw to simulate errors.
 * @param options Per-mock options (delay range, etc.)
 */
export function defineMock <R, P = unknown> (
  path: string,
  handler: MockHandler<R, P>,
  options: MockOptions = {},
): void {
  registry.set(path, { handler: handler as MockHandler<unknown, unknown>, options })
}

/**
 * Look up a registered mock entry for the given real API path.
 */
export function getMockEntry (path: string): MockEntry | undefined {
  return registry.get(path)
}

/**
 * Returns a Promise that resolves after a random delay within [min, max] ms.
 */
export function simulateDelay (range: [number, number] = DEFAULT_DELAY): Promise<void> {
  const [min, max] = range
  const ms = min + Math.random() * (max - min)
  return new Promise(resolve => setTimeout(resolve, ms))
}
