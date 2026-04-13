export enum TipType {
  SUCCESS,
  ERROR,
  INFO,
  WARNING,
}

export enum TipPosition {
  TOP,
  CENTER,
  BOTTOM,
}

// ─── Auth / role model ────────────────────────────────────────────────────────
// Extend the role ladder or rename values to match your access-control model.
export enum USER_ROLE {
  PASSENGER, // Unauthenticated visitor
  GUEST, // Trial / limited session
  USER, // Authenticated user
  AUTHED, // Elevated / verified user
  ADMIN, // Full access
}

// Maps route-guard levels to the minimum USER_ROLE required.
// Adjust if your project has a different permission hierarchy.
export enum AUTH_SCOPE {
  PUBLIC = USER_ROLE.PASSENGER,
  TRIAL = USER_ROLE.GUEST,
  PRIVATE = USER_ROLE.USER,
  AUTHED = USER_ROLE.AUTHED,
  ADMIN = USER_ROLE.ADMIN,
}

// ─── Storage keys ─────────────────────────────────────────────────────────────
// Rename these if you need a different namespacing strategy.
export const SESSION_KEYS = {
  SYSTEM_NOTICE:    '__session_system_notice_',
  DEACTIVATED_FROM: '__session_deactivated_from_',
}

export const LOCAL_SYS_KEYS = {
  FOOT_PRINT: 'foot_print',
}

export const LOCAL_USER_KEYS = {
  FLAG:   'flag',
  USER:   'user',
  LOCALE: 'locale',
}

// ─── Global events ────────────────────────────────────────────────────────────
// Core events (used by infrastructure — do not remove or rename):
//   LOGIN, LOGOUT, TOKEN_ERROR, WAKEUP
//
// Project-specific events (safe to rename, remove, or extend):
//   CONSUME, BALANCE_CHANGED — example domain events; replace with your own.
export const EVENTS = {
  // ── core ──────────────────────────────────────────────────────────────────
  LOGIN:           '_event_of_login_',
  LOGOUT:          '_event_of_logout_',
  TOKEN_ERROR:     '_event_of_token_error_',
  WAKEUP:          '_event_of_wakeup_',
  // ── project-specific (customise freely) ───────────────────────────────────
  CONSUME:         '_event_of_consume_',
  BALANCE_CHANGED: '_event_of_balance_changed_',
}

// The route users are redirected to when a PRIVATE+ page is accessed without auth.
// Change this to your login / onboarding route.
export const AUTH_PATH = '/auth'
