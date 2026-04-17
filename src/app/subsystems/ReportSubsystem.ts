/**
 * ReportSubsystem — Error capture, analytics, and event tracking.
 *
 * Responsibilities:
 *  - Capture unhandled JS errors and promise rejections globally.
 *  - Provide a `track(name, params)` API for custom analytics events.
 *  - Batch events and flush them periodically (or on dispose) to the
 *    analytics endpoint.
 *  - Optionally annotate events with the current user ID via a lazy accessor
 *    supplied at construction time (no direct coupling to AccountSubsystem).
 *
 * In production, replace the commented `fetch` call in `flush` with your
 * actual analytics endpoint (Mixpanel, Firebase, custom, etc.).
 *
 * @example
 * // In application.ts — wire the userId accessor without importing AccountSubsystem:
 * const account = new AccountSubsystem()
 * const report  = new ReportSubsystem({ getUserId: () => account.current()?.['userId'] })
 */
import type { IAppSubsystem } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrackEvent = {
  name: string
  params?: Record<string, unknown>
  userId?: unknown
  timestamp: number
}

export type ReportOptions = {
  /**
   * Flush interval in milliseconds. Defaults to 10 000 ms.
   * Adjust to balance latency against request volume.
   */
  flushIntervalMs?: number
  /**
   * Optional lazy accessor that returns the current user's ID.
   * Called at the moment each event is tracked — no need to update on login/logout.
   * Keep it lightweight (a simple property read is ideal).
   *
   * @example
   * getUserId: () => account.current()?.['userId']
   */
  getUserId?: () => unknown
}

const DEFAULT_FLUSH_INTERVAL_MS = 10_000

// ─── ReportSubsystem ──────────────────────────────────────────────────────────

export class ReportSubsystem implements IAppSubsystem {
  readonly name = 'report'

  private readonly _getUserId: (() => unknown) | undefined
  private readonly _queue: TrackEvent[] = []
  private _timer: ReturnType<typeof setTimeout> | null = null
  private readonly _flushInterval: number

  // Bound handler refs — stored so dispose() can remove the exact same functions.
  private readonly _onError: (e: ErrorEvent) => void
  private readonly _onUnhandledRejection: (e: PromiseRejectionEvent) => void

  constructor (options: ReportOptions = {}) {
    this._flushInterval = options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS
    this._getUserId = options.getUserId
    this._onError = (e: ErrorEvent) => {
      this.captureError(
        e.error instanceof Error ? e.error : new Error(e.message),
        { filename: e.filename, lineno: e.lineno, colno: e.colno },
      )
    }
    this._onUnhandledRejection = (e: PromiseRejectionEvent) => {
      const err = e.reason instanceof Error ? e.reason : new Error(String(e.reason))
      this.captureError(err)
    }
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  init (): void {
    window.addEventListener('error', this._onError)
    window.addEventListener('unhandledrejection', this._onUnhandledRejection)
  }

  dispose (): void {
    this.flush()
    window.removeEventListener('error', this._onError)
    window.removeEventListener('unhandledrejection', this._onUnhandledRejection)
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Record a named analytics event, optionally with arbitrary parameters. */
  track (name: string, params?: Record<string, unknown>): void {
    const event: TrackEvent = {
      name,
      params,
      userId: this._getUserId?.(),
      timestamp: Date.now(),
    }
    this._queue.push(event)
    this._scheduleFlush()
  }

  /**
   * Capture an Error instance with optional context.
   * Always logs to console; in production also sends via `track`.
   */
  captureError (error: Error, context?: Record<string, unknown>): void {
    console.error('[Report]', error, context)
    this.track('__error__', {
      message: error.message,
      stack: error.stack,
      ...context,
    })
  }

  /**
   * Immediately send all queued events and cancel any pending scheduled flush.
   * Safe to call manually at any time (e.g. before navigation or on page hide).
   */
  flush (): void {
    // Always cancel the debounce timer — whether or not there are events to send.
    if (this._timer !== null) {
      clearTimeout(this._timer)
      this._timer = null
    }
    if (!this._queue.length) return

    const events = this._queue.splice(0)

    if (import.meta.env.PROD) {
      // Replace with your analytics endpoint:
      // fetch('/api/analytics/batch', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(events),
      //   keepalive: true,
      // })
    } else {
      console.debug('[Report] flush', events)
    }
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  private _scheduleFlush (): void {
    if (this._timer !== null) return
    this._timer = setTimeout(() => this.flush(), this._flushInterval)
  }
}
