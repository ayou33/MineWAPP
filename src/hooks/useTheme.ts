/**
 * Reactive theme singleton — light / dark.
 *
 * Priority: localStorage → system prefers-color-scheme → light
 * Toggle: adds/removes `class="dark"` on <html>.
 * Persistence: localStorage key LOCAL_SYS_KEYS.THEME ("theme")
 *
 * Import anywhere; module-level init ensures class is applied
 * before first render (no FOUC in CSR).
 */
import { LOCAL_SYS_KEYS } from '@/config'
import { localGet, localSet } from 'lunzi'
import { createSignal } from 'solid-js'

interface ClickOrigin { clientX: number; clientY: number }

function applyClass (dark: boolean, origin?: ClickOrigin) {
  const html = document.documentElement
  const toggle = () => html.classList.toggle('dark', dark)

  // View Transitions API — clip-path circle reveal (Chrome 111+, Safari 18+).
  // Old state stays fully opaque underneath; new state is revealed by an
  // expanding circle from the click point → zero transparency → zero flash.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vt = (document as any).startViewTransition
  if (typeof vt === 'function') {
    const x = origin ? origin.clientX : window.innerWidth / 2
    const y = origin ? origin.clientY : window.innerHeight / 2
    // Radius large enough to cover the viewport from any origin point.
    const r = Math.ceil(Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    ))
    html.style.setProperty('--vt-x', `${x}px`)
    html.style.setProperty('--vt-y', `${y}px`)
    html.style.setProperty('--vt-r', `${r}px`)
    vt.call(document, toggle)
    return
  }

  // Fallback: force a reflow between adding the transition class and toggling
  // .dark so the browser sees two distinct style frames.
  html.classList.add('theme-transitioning')
  void html.offsetHeight // force reflow — commits "before" snapshot
  toggle()
  setTimeout(() => html.classList.remove('theme-transitioning'), 350)
}

const saved = localGet(LOCAL_SYS_KEYS.THEME) as string | null
const initialDark = saved !== null ? saved === 'dark' : true

// Apply immediately on load — no transition class so there's no flash.
document.documentElement.classList.toggle('dark', initialDark)

const [isDark, setIsDark] = createSignal(initialDark)

export function setTheme (dark: boolean, origin?: ClickOrigin) {
  localSet(LOCAL_SYS_KEYS.THEME, dark ? 'dark' : 'light')
  applyClass(dark, origin)
  setIsDark(dark)
}

export function toggleTheme (origin?: ClickOrigin) {
  setTheme(!isDark(), origin)
}

export { isDark }
