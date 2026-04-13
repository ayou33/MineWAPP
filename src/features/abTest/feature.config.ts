/**
 * File: feature.config.ts
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                 PROJECT-SPECIFIC A/B TEST CONFIGURATION                 │
 * │                                                                         │
 * │  1. Add entries to the `Feature` enum for each controlled feature.      │
 * │  2. Configure rollout rules in `ControlledFeatures`.                    │
 * │  3. Wire `platformContext` to your native app bridge (if applicable).   │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { FeatureControl, PlatformContext } from './abTest.engine'

// ─── 1. Feature catalog ───────────────────────────────────────────────────────
// Add a new variant for each feature you want to gate.
// The string value is used as a stable identifier — do not change once deployed.
export enum Feature {
  A = 'a',
  // Example:
  // NEW_CHECKOUT = 'new_checkout',
  // DARK_MODE    = 'dark_mode',
}

// ─── 2. Rollout rules ─────────────────────────────────────────────────────────
// groups: which AppUser.group numbers see the feature (omit = all authenticated users)
// versions: minimum native app version required (omit = no version gate)
export const ControlledFeatures: Partial<Record<Feature, FeatureControl>> = {
  [Feature.A]: {
    versions: {
      ios: '9.9.9',
      // android: '2.0.0',
      // web: true,
    },
  },
}

// ─── 3. Platform context ──────────────────────────────────────────────────────
// Wire these to your native app bridge (e.g. JSBridge, Capacitor, React Native WebView).
// For pure web projects, leave isApp / isIOSApp / isAndroidApp as false.
export const platformContext: PlatformContext = {
  appVersion: '9.9.9', // replace with bridge.getAppVersion() or import.meta.env.VITE_APP_VERSION
  isApp: false, // replace with bridge detection logic
  isIOSApp: false,
  isAndroidApp: false,
}
