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

// The route users are redirected to when a PRIVATE+ page is accessed without auth.
// Change this to your login / onboarding route.
export const AUTH_PATH = '/auth'
