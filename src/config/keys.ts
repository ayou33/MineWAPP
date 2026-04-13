/**
 * Project: MineWAPP
 * File: src/config/keys.ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2026/4/13 16:27
 * Description:
 */

// ─── system keys ─────────────────────────────────────────────────────────────
// Rename these if you need a different namespacing strategy.
export const LOCAL_SYS_KEYS = {
  FOOT_PRINT: 'foot_print',
}

// used for none-project communicate
export const SIGNALS = {}

// ─── user/project keys ────────────────────────────────────────────────────────────
// Core events (used by infrastructure — do not remove or rename):
//   LOGIN, LOGOUT, TOKEN_ERROR, WAKEUP
//
// Project-specific events (safe to rename, remove, or extend):
//   CONSUME, BALANCE_CHANGED — example domain events; replace with your own.
export const EVENTS = {
  // ── core ──────────────────────────────────────────────────────────────────
  LOGIN: '_event_of_login_',
  LOGOUT: '_event_of_logout_',
  TOKEN_ERROR: '_event_of_token_error_',
  WAKEUP: '_event_of_wakeup_',
  // ── project-specific (customise freely) ───────────────────────────────────
  CONSUME: '_event_of_consume_',
  BALANCE_CHANGED: '_event_of_balance_changed_',
}

export const SESSION_KEYS = {
  SYSTEM_NOTICE: '__session_system_notice_',
  DEACTIVATED_FROM: '__session_deactivated_from_',
}

export const LOCAL_USER_KEYS = {
  FLAG: 'flag',
  USER: 'user',
  LOCALE: 'locale',
}
