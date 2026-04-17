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

export enum AUTH_ROLE {
  PASSENGER = -1, // Unauthenticated visitor
  GUEST, // Trial / limited session
  USER, // Authenticated user
  AUTHED, // Elevated / verified user
  ADMIN, // Full access
}

// The route users are redirected to when a PRIVATE+ page is accessed without auth.
// Change this to your login / onboarding route.
export const AUTH_PATH = '/auth'
