/**
 * File: abTest.engine.ts
 *
 * Core A/B test engine — do not edit for project-specific concerns.
 * See feature.config.ts for feature definitions and platform wiring.
 */

// ─── Core types ───────────────────────────────────────────────────────────────
export type FeatureControl = {
  /** User groups that have access to this feature. Omit to allow all authenticated users. */
  groups?: number[]
  /** Minimum native app version required per platform. */
  versions?: {
    android?: string
    ios?: string
    /** Set to true to enable on web regardless of version gating. */
    web?: boolean
  }
}

export type PlatformContext = {
  appVersion: string
  isApp: boolean
  isIOSApp: boolean
  isAndroidApp: boolean
}

// ─── Version utilities ────────────────────────────────────────────────────────
export function compareVersion (ver = '', ref = ''): number {
  const v1Arr = ver.split('.')
  const v2Arr = ref.split('.')
  const len = Math.max(v1Arr.length, v2Arr.length)
  for (let i = 0; i < len; i++) {
    const version = parseInt(v1Arr[i] || '0')
    const refer = parseInt(v2Arr[i] || '0')
    if (version > refer) return 1
    if (version < refer) return -1
  }
  return 0
}

export function gte (currentVersion: string, ref: string): boolean {
  return compareVersion(currentVersion, ref) >= 0
}

// ─── Feature compatibility check ─────────────────────────────────────────────
/**
 * Returns true if the current platform + app version satisfies the feature's
 * version gates. When no version constraints are defined, always returns true.
 */
export function compatible (control: FeatureControl | undefined, ctx: PlatformContext): boolean {
  if (!control?.versions) return true

  if (ctx.isIOSApp && control.versions.ios) {
    return gte(ctx.appVersion, control.versions.ios)
  }

  if (ctx.isAndroidApp && control.versions.android) {
    return gte(ctx.appVersion, control.versions.android)
  }

  return ctx.isApp ? true : control.versions.web === true
}
