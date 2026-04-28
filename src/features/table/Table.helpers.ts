import type { ColumnDef } from './types'

export const SELECTION_COL_W = 40
const MIN_UNIT_PX = 60
const DEFAULT_COL_PX = 120

/**
 * Parse a CSS width string to an approximate pixel value.
 * Supports: px, rem, em, %, vw
 */
export function parseWidthToPx (cssWidth: string, containerPx: number): number {
  const s = cssWidth.trim()
  let m: RegExpMatchArray | null

  m = s.match(/^([\d.]+)px$/)
  if (m) return parseFloat(m[1])

  m = s.match(/^([\d.]+)rem$/)
  if (m) {
    const base = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    return parseFloat(m[1]) * base
  }

  m = s.match(/^([\d.]+)em$/)
  if (m) return parseFloat(m[1]) * 16

  m = s.match(/^([\d.]+)%$/)
  if (m) return (parseFloat(m[1]) / 100) * containerPx

  m = s.match(/^([\d.]+)vw$/)
  if (m) return (parseFloat(m[1]) / 100) * (typeof window !== 'undefined' ? window.innerWidth : 1000)

  return DEFAULT_COL_PX
}

export function alignClass (align?: 'left' | 'center' | 'right'): string {
  if (align === 'center') return 'text-center'
  if (align === 'right') return 'text-right'
  return 'text-left'
}

/**
 * Compute pixel widths for all columns.
 *
 * - String widths (e.g. '200px', '20%', '10rem') → parsed to pixels directly
 * - Number widths → flex-like: proportional share of remaining space after
 *   subtracting all string-width columns; minimum = weight × MIN_UNIT_PX
 * - Undefined width → treated as weight = 1
 *
 * If string-width columns consume all available space (or overflow), numeric
 * columns fall back to their minimum widths, causing the table to overflow
 * and trigger horizontal scrolling.
 */
export function computeColWidthsPx<T extends Record<string, unknown>> (
  cols: ColumnDef<T>[],
  containerPx: number,
  selWidth: number,
): number[] {
  if (containerPx <= 0) return cols.map(() => DEFAULT_COL_PX)

  const available = containerPx - selWidth

  const stringWidthSum = cols
    .filter(c => typeof c.width === 'string')
    .reduce((s, c) => s + parseWidthToPx(c.width as string, containerPx), 0)

  const totalWeight = cols.reduce((s, c) => {
    if (typeof c.width === 'string') return s
    return s + (typeof c.width === 'number' ? c.width : 1)
  }, 0)

  const remaining = available - stringWidthSum

  return cols.map(col => {
    if (typeof col.width === 'string') return parseWidthToPx(col.width, containerPx)
    const weight = typeof col.width === 'number' ? col.width : 1
    const proportional = totalWeight > 0 && remaining > 0
      ? (weight / totalWeight) * remaining
      : 0
    return Math.max(weight * MIN_UNIT_PX, proportional)
  })
}
