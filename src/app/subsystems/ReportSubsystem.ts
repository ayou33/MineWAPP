/**
 * ReportSubsystem — Error capture, analytics, and event tracking.
 *
 * Responsibilities:
 *  - Capture unhandled JS errors and promise rejections globally.
 *  - Provide a `track(name, params)` API for custom analytics events.
 *  - Batch events and flush them periodically (or on dispose) to the
 *    analytics endpoint.
 *  - Automatically annotate events with the current user ID when available.
 *
 * In production, replace the commented `fetch` call in `_flush` with your
 * actual analytics endpoint (Mixpanel, Firebase, custom, etc.).
 */
import type { AppBase, IAppSubsystem } from './types'
import type { AccountSubsystem } from './AccountSubsystem'

export type TrackEvent = {
  name: string
  params?: Record<string, unknown>
  userId?: string | number
  timestamp: number
}

interface AppWithAccount extends AppBase {
  account: AccountSubsystem
}

const FLUSH_INTERVAL_MS = 3_000

export class ReportSubsystem implements IAppSubsystem<AppWithAccount> {
  readonly name = 'report'

  private _accountSys: AccountSubsystem | null = null
  private readonly _queue: TrackEvent[] = []
  private _timer: ReturnType<typeof setTimeout> | null = null

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  init (app: AppWithAccount): void {
    this._accountSys = app.account
    this._attachGlobalHandlers()
  }

  dispose (): void {
    this.flush()
    if (this._timer !== null) {
      clearTimeout(this._timer)
      this._timer = null
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Record a named analytics event, optionally with arbitrary parameters. */
  track (name: string, params?: Record<string, unknown>): void {
    const event: TrackEvent = {
      name,
      params,
      userId: this._accountSys?.current()?.userId,
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

  /** Immediately send all queued events (bypasses the debounce timer). */
  flush (): void {
    if (!this._queue.length) return

    const events = this._queue.splice(0)
    this._timer = null

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
    this._timer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS)
  }

  private _attachGlobalHandlers (): void {
    window.addEventListener('error', (e) => {
      this.captureError(
        e.error instanceof Error ? e.error : new Error(e.message),
        { filename: e.filename, lineno: e.lineno, colno: e.colno },
      )
    })

    window.addEventListener('unhandledrejection', (e) => {
      const err = e.reason instanceof Error
        ? e.reason
        : new Error(String(e.reason))
      this.captureError(err)
    })
  }
}

