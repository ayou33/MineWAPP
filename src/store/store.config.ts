/**
 * File: store.config.ts
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                 PROJECT-SPECIFIC GLOBAL STATE DEFINITION                │
 * │                                                                         │
 * │  Define your app's global state shape and its default values here.      │
 * │  The store infrastructure (useSelector, createScopedActions) in         │
 * │  index.ts never needs to be edited across projects.                     │
 * │                                                                         │
 * │  To add a new slice:                                                    │
 * │    1. Add the key + type to `State`                                     │
 * │    2. Add its default value to `initialState`                           │
 * │    3. Create scoped actions with createScopedActions('key', { … })      │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

// ─── Global state shape ───────────────────────────────────────────────────────
// Every key here is a state slice. Add, remove, or reshape slices freely.
export type State = {
  user: {
    id: string | number | null
    name: string
    avatar: string
  }
  // Example additional slices:
  // cart: { items: CartItem[]; total: number }
  // settings: { theme: 'light' | 'dark'; notifications: boolean }
}

// ─── Default values ───────────────────────────────────────────────────────────
export const initialState: State = {
  user: {
    id: null,
    name: '',
    avatar: '',
  },
}
