import { createEffect, createMemo, For, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'

export const ITEM_HEIGHT = 44
const VISIBLE_COUNT = 5
const CENTER_PAD = Math.floor(VISIBLE_COUNT / 2) * ITEM_HEIGHT

interface WheelColumnProps {
  items: string[]
  selectedIndex: number
  onChange: (index: number) => void
}

export default function WheelColumn (props: WheelColumnProps) {
  let el: HTMLDivElement | undefined

  // ── internal drag state (non-reactive, mutated directly) ──────────────────
  let startY = 0
  let startOffset = 0
  let velY = 0
  let prevY = 0
  let prevTime = 0
  let rafId = 0
  let dragging = false

  // ── reactive offset ───────────────────────────────────────────────────────
  const [st, setSt] = createStore({ offset: 0 })

  function targetOffset (idx: number) { return -idx * ITEM_HEIGHT }

  function clampOffset (o: number) {
    return Math.max(-(props.items.length - 1) * ITEM_HEIGHT, Math.min(0, o))
  }

  function indexFromOffset (o: number) {
    return Math.max(0, Math.min(Math.round(-o / ITEM_HEIGHT), props.items.length - 1))
  }

  function animateTo (target: number, reportIdx: number) {
    cancelAnimationFrame(rafId)
    const step = () => {
      setSt(s => {
        const diff = target - s.offset
        if (Math.abs(diff) < 0.5) {
          props.onChange(reportIdx)
          return { offset: target }
        }
        rafId = requestAnimationFrame(step)
        return { offset: s.offset + diff * 0.22 }
      })
    }
    rafId = requestAnimationFrame(step)
  }

  // sync external selectedIndex changes (skip while dragging)
  createEffect(() => {
    if (!dragging) {
      setSt({ offset: targetOffset(props.selectedIndex) })
    }
  })

  onCleanup(() => cancelAnimationFrame(rafId))

  // ── derived selected index (for visual highlighting) ─────────────────────
  const selectedIdx = createMemo(() => indexFromOffset(st.offset))

  // ── pointer events ────────────────────────────────────────────────────────
  function onPointerDown (e: PointerEvent) {
    dragging = true
    startY = e.clientY
    startOffset = st.offset
    velY = 0
    prevY = e.clientY
    prevTime = Date.now()
    cancelAnimationFrame(rafId)
    el?.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove (e: PointerEvent) {
    if (!dragging) return
    const now = Date.now()
    const dt = now - prevTime
    if (dt > 0) velY = ((e.clientY - prevY) / dt) * 16
    prevY = e.clientY
    prevTime = now
    setSt({ offset: clampOffset(startOffset + e.clientY - startY) })
    e.preventDefault()
  }

  function onPointerUp () {
    dragging = false
    const projected = clampOffset(st.offset + velY * 5)
    const idx = indexFromOffset(projected)
    animateTo(targetOffset(idx), idx)
  }

  function onWheel (e: WheelEvent) {
    e.preventDefault()
    cancelAnimationFrame(rafId)
    const cur = indexFromOffset(st.offset)
    const next = Math.max(0, Math.min(cur + Math.sign(e.deltaY), props.items.length - 1))
    animateTo(targetOffset(next), next)
  }

  function onItemClick (idx: number) {
    animateTo(targetOffset(idx), idx)
  }

  return (
    <div
      ref={(node) => { el = node }}
      class="flex-1 overflow-hidden relative touch-none cursor-grab active:cursor-grabbing z-[2]"
      style={{ height: `${ITEM_HEIGHT * VISIBLE_COUNT}px` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <div
        class="will-change-transform"
        style={{ transform: `translateY(${st.offset + CENTER_PAD}px)` }}
      >
        <For each={props.items}>
          {(item, i) => {
            const dist = () => Math.abs(i() - selectedIdx())
            const opacity = () => `${Math.max(0.18, 1 - dist() * 0.3)}`
            const scale = () => `${Math.max(0.68, 1 - dist() * 0.1)}`
            const weight = () => (dist() === 0 ? '600' : '400')
            const color = () => (dist() === 0 ? 'var(--md-primary)' : 'var(--c-text)')

            return (
              <div
                class="flex items-center justify-center text-base cursor-pointer"
                style={{
                  height: `${ITEM_HEIGHT}px`,
                  opacity: opacity(),
                  transform: `scale(${scale()})`,
                  'font-weight': weight(),
                  color: color(),
                  transition: 'opacity 60ms linear, transform 60ms linear',
                }}
                onClick={() => onItemClick(i())}
              >
                {item}
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}
