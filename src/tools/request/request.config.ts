/**
 * File: request.config.ts
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║             PROJECT-SPECIFIC REQUEST LAYER CONFIGURATION                ║
 * ║                                                                          ║
 * ║  This is the single file you need to edit when adapting this template   ║
 * ║  to a new project. Everything here is intentionally separated from      ║
 * ║  the core request infrastructure (index.ts, request.axios.ts, …) so    ║
 * ║  that those files remain untouched across projects.                     ║
 * ║                                                                          ║
 * ║  Customisation checklist:                                                ║
 * ║    1. ERROR_CODE      — your backend's error code catalog               ║
 * ║    2. ServerResponse  — the envelope shape your API returns             ║
 * ║    3. Pagination      — pagination field names your backend expects     ║
 * ║    4. ApiPath         — URL path prefixes your backend exposes          ║
 * ║    5. buildCommonParams — fields merged into every request              ║
 * ║    6. responseParser  — how to unwrap responses and handle errors       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { emit } from '@/common/event'
import { EVENTS, AUTH_ROLE } from '@/config'
import application from '@/app/application'
import { AxiosResponse } from 'axios'

// ─── 1. Error codes ───────────────────────────────────────────────────────────
/**
 * Map your backend's error codes to named constants.
 * These are referenced inside `responseParser` to handle special cases globally.
 *
 * Example additions:
 *   PERMISSION_DENIED: '00010',
 *   ACCOUNT_BANNED:    '00011',
 */
export const ERROR_CODE = {
  TOKEN_EXPIRED: '00009',
}

// ─── 2. Server response envelope ─────────────────────────────────────────────
/**
 * The outer wrapper your backend returns for every API call.
 * Adjust field names and the shape of both the success and failure branches
 * to match your contract.
 *
 * Common alternatives:
 *   { code: 0, data: T }  vs  { code: number, msg: string }
 *   { status: 'ok', result: T }
 */
export type ServerResponse<T> = {
  success: true
  data: T
} | {
  success: false
  errorCode: string
  errorInfo: string
}

// ─── 3. Pagination params ─────────────────────────────────────────────────────
/**
 * Fields your backend expects for paginated requests.
 * Rename if your backend uses different conventions, e.g.:
 *   { page: number; limit: number }
 *   { offset: number; count: number }
 */
export type Pagination = {
  pageSize: number
  pageNum: number
}

// ─── 4. API path prefixes ─────────────────────────────────────────────────────
/**
 * The URL path namespaces your backend exposes.
 * Extend the union with any new prefixes your project adds.
 *
 * Example: `/${'api' | 'v2' | 'admin' | 'upload'}/${string}`
 */
export type ApiPath = `/${'api' | 'app' | 'lang' | 'news'}/${string}`

/** API path prefixed with `$` to mark it as mockable in dev. */
export type MockPath = `$${ApiPath}`

// ─── 5. Common request params ─────────────────────────────────────────────────
/**
 * Fields merged into every GET / POST request automatically (via axios interceptors
 * and the worker pre-request interceptor).
 *
 * Typical additions:
 *   - App version:    appVersion: import.meta.env.VITE_APP_VERSION
 *   - Device ID:      deviceId: getDeviceId()
 *   - Market/channel: market: import.meta.env.VITE_MARKET ?? 'web'
 *   - Request signature / HMAC for tamper-resistance
 */
export function buildCommonParams (): Record<string, unknown> {
  return {
    language: application.locale(),
    _t: Date.now(),
    ...buildUserParams(),
  }
}

/**
 * Returns auth fields when a user session exists, `null` otherwise.
 * Rename or add fields to match what your backend expects for authentication.
 *
 * Example (JWT header-based auth — remove from params and add to axios headers instead):
 *   axios.defaults.headers.common['Authorization'] = `Bearer ${_user.token}`
 */
function buildUserParams (): Record<string, unknown> | null {
  const _user = application.account.current()
  if (_user) {
    return {
      userId: _user.userId,
      token: _user.token,
    }
  }
  return null
}

// ─── 6. Response parser ───────────────────────────────────────────────────────
/**
 * Called for every successful HTTP response before data is returned to the caller.
 * Unwraps the `ServerResponse` envelope, handles global error codes, and throws
 * normalized errors for the caller to catch.
 *
 * Customise here to:
 *   - Support a different success/failure shape (see `ServerResponse` above)
 *   - Add new global error-code handlers (rate-limiting, maintenance mode, …)
 *   - Transform or normalise the unwrapped data before it reaches the caller
 */
export function responseParser<T> (url: string, resp: AxiosResponse<ServerResponse<T>>): T {
  const body = resp.data

  // Static JSON files (e.g. i18n bundles) bypass envelope parsing.
  if (url.endsWith('.json')) {
    return body as T
  }

  if (body.success) {
    return body.data
  }

  // Expired session: emit global event so the app can redirect to login.
  if (body.errorCode === ERROR_CODE.TOKEN_EXPIRED) {
    // Guest / trial sessions silently ignore token errors.
    if (application.role() === AUTH_ROLE.GUEST) {
      return null as T
    }
    emit(EVENTS.TOKEN_ERROR)
  }

  // All other business errors propagate as catchable exceptions.
  // The caller receives: { data, url, code, message }  (normalised in index.ts).
  throw body
}
