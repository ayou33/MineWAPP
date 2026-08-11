# src/features/abTest — A/B Testing

Group + platform/version-gated feature flags, static and lazy rendering.

## Files
| File | Role |
|---|---|
| `ABTest.tsx` | Main component; `ifFeatureAllowed(feature, userGroup)` (core) |
| `Alternative.tsx` | Lazy component switcher (`default`/`fallback` exports) (core) |
| `FeatureAlternative.tsx` | Convenience wrapper — lazy-loads a module, renders `default`/`fallback` via `ifFeatureAllowed(feature, userGroup)` |
| `abTest.engine.ts` | `FeatureControl`, `compareVersion`, `gte`, `compatible` (core, do not edit) |
| `feature.config.ts` | **Project config**: `Feature` enum, `ControlledFeatures`, `platformContext` |
| `sample-feature.ts` | Stale demo — delete |

## Config
- `Feature` enum values are stable identifiers — never rename a shipped value.
- `ControlledFeatures[feature] = { groups?: number[], versions?: { ios?, android?, web? } }`.
- `platformContext` must be wired to the native bridge (`appVersion`, `isApp`, `isIOSApp`, `isAndroidApp`).

## Usage
```tsx
<ABTest feature={Feature.A} fallback={<Old />}><New /></ABTest>
<ABTest feature={Feature.A} load={() => import('./MyFeature')} />
```
