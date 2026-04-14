/**
 * Browser fingerprinting — `resolveWebId()`
 *
 * Generates a stable, 16-character hex identifier for the current
 * device/browser combination from a wide set of synchronously readable
 * browser traits.  The result is persisted in localStorage so subsequent
 * visits return the same value without re-computing.
 *
 * Trait groups collected:
 *   · Navigator  — UA, languages, platform, vendor, plugins, connection
 *   · Hardware   — cores, memory, touch points
 *   · Display    — screen size/depth/orientation, DPR, viewport
 *   · Locale     — timezone, locale, UTC offset, number / collation format
 *   · CSS media  — color-scheme, motion, contrast, pointer, display-mode …
 *   · API flags  — feature-detection booleans
 *   · Canvas 2D  — pixel-level rendering (fonts, gradients, compositing)
 *   · WebGL      — renderer / vendor / capability limits / extension list
 *
 * Hash: MurmurHash3-inspired 64-bit (two 32-bit lanes) → 2⁶⁴ collision space.
 */
import { LOCAL_SYS_KEYS } from '@/config'
import { localGet, localSet } from 'lunzi'

/**
 * Return the persisted fingerprint for this browser, or generate, persist,
 * and return a new one if none exists yet.
 */
export function resolveWebId (): string {
  const stored = localGet(LOCAL_SYS_KEYS.FOOT_PRINT)
  if (stored) return stored as string
  const id = _generateWebId()
  localSet(LOCAL_SYS_KEYS.FOOT_PRINT, id)
  return id
}

// ─── Trait collectors ─────────────────────────────────────────────────────────

function _navTraits (): string[] {
  const s = (v: unknown) => String(v ?? '')
  const conn = (navigator as unknown as Record<string, unknown>)['connection'] as Record<string, unknown> | undefined
  let plugins = ''
  try { plugins = Array.from(navigator.plugins).map(p => p.name).sort().join(',') } catch { /* ignore */ }
  return [
    s(navigator.userAgent),
    s(navigator.languages?.join(',')),
    s(navigator.platform),
    s(navigator.vendor),
    s(navigator.cookieEnabled),
    s(navigator.doNotTrack),
    s(navigator.maxTouchPoints),
    s(navigator.hardwareConcurrency),
    s((navigator as unknown as Record<string, unknown>)['deviceMemory']),
    s((navigator as unknown as Record<string, unknown>)['pdfViewerEnabled']),
    plugins,
    s(conn?.['effectiveType']),
    s(conn?.['downlink']),
    s(conn?.['rtt']),
  ]
}

function _displayTraits (): string[] {
  const s = (v: unknown) => String(v ?? '')
  return [
    `${screen.width}x${screen.height}`,
    `${screen.availWidth}x${screen.availHeight}`,
    s(screen.colorDepth),
    s(screen.pixelDepth),
    s(screen.orientation?.type),
    s(window.devicePixelRatio),
    `${window.outerWidth}x${window.outerHeight}`,
    `${window.innerWidth}x${window.innerHeight}`,
  ]
}

function _localeTraits (): string[] {
  const s = (v: unknown) => String(v ?? '')
  const dtf = Intl.DateTimeFormat().resolvedOptions()
  let numFormat = '', collation = ''
  try { numFormat = (12345678.9).toLocaleString() } catch { /* ignore */ }
  try { numFormat += Intl.NumberFormat().resolvedOptions().numberingSystem } catch { /* ignore */ }
  try { collation = new Intl.Collator().resolvedOptions().collation } catch { /* ignore */ }
  return [
    s(dtf.timeZone),
    s(dtf.locale),
    s(new Date().getTimezoneOffset()),
    numFormat,
    collation,
  ]
}

function _mediaTraits (): string[] {
  const mq = (q: string) => { try { return String(window.matchMedia(q).matches) } catch { return '' } }
  return [
    mq('(prefers-color-scheme: dark)'),
    mq('(prefers-reduced-motion: reduce)'),
    mq('(prefers-contrast: more)'),
    mq('(pointer: coarse)'),
    mq('(hover: none)'),
    mq('(forced-colors: active)'),
    mq('(display-mode: standalone)'),
    mq('(dynamic-range: high)'),
  ]
}

function _apiTraits (): string[] {
  const w = window as unknown as Record<string, unknown>
  return [
    String(typeof indexedDB !== 'undefined'),
    String(typeof SharedArrayBuffer !== 'undefined'),
    String(typeof Intl.Segmenter !== 'undefined'),
    String(typeof w['PublicKeyCredential'] !== 'undefined'),
    String(typeof AudioContext !== 'undefined' || typeof w['webkitAudioContext'] !== 'undefined'),
  ]
}

/**
 * Render text, gradients, and composited shapes onto an off-screen canvas.
 * The resulting PNG data URL encodes sub-pixel differences in font rasterisation
 * and GPU compositing that vary across OS, browser, and graphics driver.
 */
function _canvasFingerprint (): string {
  try {
    const cv = document.createElement('canvas')
    cv.width = 280; cv.height = 60
    const cx = cv.getContext('2d')!
    cx.textBaseline = 'alphabetic'
    cx.font = '600 14px Arial,Helvetica,sans-serif'
    cx.fillStyle = 'rgba(255,102,0,0.9)'
    cx.fillRect(0, 0, 280, 60)
    cx.fillStyle = '#06699c'
    cx.fillText('MineWAPP Browser Fingerprint', 4, 22)
    cx.fillStyle = 'rgba(102,204,0,0.75)'
    cx.fillText('MineWAPP Browser Fingerprint', 5, 23)
    cx.font = 'italic 11px Georgia,serif'
    cx.fillStyle = 'rgba(128,0,128,0.8)'
    // Mixed-script string: Latin · Greek · CJK · Arabic
    cx.fillText('\u0041\u03B1\u4E2D\u0627\u0645', 4, 42)
    const g = cx.createLinearGradient(0, 50, 280, 60)
    g.addColorStop(0, '#ff0000'); g.addColorStop(0.5, '#00ff00'); g.addColorStop(1, '#0000ff')
    cx.fillStyle = g; cx.fillRect(0, 50, 280, 10)
    cx.globalCompositeOperation = 'multiply'
    cx.beginPath(); cx.arc(240, 30, 18, 0, Math.PI * 2)
    cx.fillStyle = 'rgba(0,0,200,0.5)'; cx.fill()
    return cv.toDataURL()
  } catch { return '' }
}

function _webglTraits (): string[] {
  try {
    const cv = document.createElement('canvas')
    const gl = (cv.getContext('webgl') ?? cv.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return ['']
    const di = gl.getExtension('WEBGL_debug_renderer_info')
    const s = (p: number) => String(gl.getParameter(p) ?? '')
    return [
      di ? s(di.UNMASKED_RENDERER_WEBGL) : s(gl.RENDERER),
      di ? s(di.UNMASKED_VENDOR_WEBGL) : s(gl.VENDOR),
      s(gl.VERSION),
      s(gl.SHADING_LANGUAGE_VERSION),
      s(gl.MAX_TEXTURE_SIZE),
      s(gl.MAX_RENDERBUFFER_SIZE),
      s(gl.MAX_VERTEX_ATTRIBS),
      s(gl.MAX_VERTEX_UNIFORM_VECTORS),
      s(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      s(gl.MAX_VARYING_VECTORS),
      gl.getSupportedExtensions()?.slice().sort().join(',') ?? '',
    ]
  } catch { return [''] }
}

// ─── Assembly & hashing ───────────────────────────────────────────────────────

function _generateWebId (): string {
  const parts = [
    ..._navTraits(),
    ..._displayTraits(),
    ..._localeTraits(),
    ..._mediaTraits(),
    ..._apiTraits(),
    _canvasFingerprint(),
    ..._webglTraits(),
  ]
  return _hash64(parts.join('\x00'))
}

/**
 * MurmurHash3-inspired 64-bit hash (two independent 32-bit lanes).
 * Returns a 16-character lowercase hex string.
 */
function _hash64 (str: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x9e3779b9)
    h2 = Math.imul(h2 ^ c, 0x85ebca6b)
  }
  h1 ^= Math.imul(h1 ^ (h1 >>> 17), 0xff51afd7)
  h1 ^= Math.imul(h1 ^ (h1 >>> 13), 0xc4ceb9fe)
  h2 ^= Math.imul(h2 ^ (h2 >>> 17), 0xff51afd7)
  h2 ^= Math.imul(h2 ^ (h2 >>> 13), 0xc4ceb9fe)
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')
}
