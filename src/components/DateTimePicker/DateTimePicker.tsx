import { createEffect, createMemo, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import { isPC } from '@/config'
import WheelColumn, { ITEM_HEIGHT } from './WheelColumn'

export type DateTimePickerMode = 'date' | 'time' | 'datetime'

export interface DateTimePickerProps {
  mode?: DateTimePickerMode
  value?: Date
  minYear?: number
  maxYear?: number
  onConfirm?: (date: Date) => void
  onCancel?: () => void
}

// ─────────────────────────────────────────────────────────────────────────────

function daysInMonth (year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function pad2 (n: number) { return String(n).padStart(2, '0') }

function buildRange (start: number, end: number, fmt: (n: number) => string) {
  return Array.from({ length: end - start + 1 }, (_, i) => fmt(start + i))
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DateTimePicker (props: DateTimePickerProps) {
  const mode = () => props.mode ?? 'datetime'
  const now = new Date()
  const minY = () => props.minYear ?? now.getFullYear() - 5
  const maxY = () => props.maxYear ?? now.getFullYear() + 10

  const init = props.value ?? now

  const [st, setSt] = createStore({
    year:   init.getFullYear(),
    month:  init.getMonth(), // 0-based
    day:    init.getDate() - 1, // 0-based index into days array
    hour:   init.getHours(),
    minute: init.getMinutes(),
  })

  // ── column item lists ────────────────────────────────────────────────────
  const years = createMemo(() => buildRange(minY(), maxY(), y => `${y}年`))
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  const days = createMemo(() => buildRange(1, daysInMonth(st.year, st.month), d => `${d}日`))
  const hours = buildRange(0, 23, h => `${pad2(h)}时`)
  const minutes = buildRange(0, 59, m => `${pad2(m)}分`)

  // ── derived column indices ───────────────────────────────────────────────
  const yearIdx = createMemo(() => st.year - minY())

  // Clamp day when month/year changes
  createEffect(() => {
    const max = daysInMonth(st.year, st.month) - 1
    if (st.day > max) setSt('day', max)
  })

  // ── handlers ─────────────────────────────────────────────────────────────
  function handleYear (idx: number) { setSt('year', minY() + idx) }
  function handleMonth (idx: number) { setSt('month', idx) }
  function handleDay (idx: number) { setSt('day', idx) }
  function handleHour (idx: number) { setSt('hour', idx) }
  function handleMinute (idx: number) { setSt('minute', idx) }

  function buildDate () {
    const d = new Date(now)
    if (mode() !== 'time') d.setFullYear(st.year, st.month, st.day + 1)
    if (mode() !== 'date') {
      d.setHours(st.hour, st.minute, 0, 0)
    } else {
      d.setHours(0, 0, 0, 0)
    }
    return d
  }

  function handleConfirm () { props.onConfirm?.(buildDate()) }
  function handleCancel () { props.onCancel?.() }

  const title = () => mode() === 'date' ? '选择日期' : mode() === 'time' ? '选择时间' : '选择日期和时间'

  return (
    <div
      class={`w-full bg-[var(--c-surface)] overflow-hidden ${isPC ? '' : 'rounded-t-[1.25rem]'}`}
      style={{ 'padding-bottom': 'env(safe-area-inset-bottom, 0)' }}
    >
      {/* ── header ── */}
      <div class="flex items-center justify-between px-5 py-4 border-b border-[var(--c-divider)]">
        <button
          class="bg-transparent border-0 py-1 cursor-pointer text-[0.9375rem] min-w-12 transition-opacity duration-150 active:opacity-60 text-[var(--c-text-muted)] text-left"
          onClick={handleCancel}
        >取消</button>
        <span class="flex-1 text-base font-semibold text-[var(--c-text)] text-center">{title()}</span>
        <button
          class="bg-transparent border-0 py-1 cursor-pointer text-[0.9375rem] min-w-12 transition-opacity duration-150 active:opacity-60 text-[var(--md-primary)] font-semibold text-right"
          onClick={handleConfirm}
        >确定</button>
      </div>

      {/* ── wheels ── */}
      <div class="flex relative pb-4 px-3 before:content-[''] before:absolute before:top-0 before:inset-x-0 before:h-[44px] before:pointer-events-none before:z-[1] before:bg-gradient-to-b before:from-[var(--c-surface)] before:to-transparent after:content-[''] after:absolute after:bottom-4 after:inset-x-0 after:h-[44px] after:pointer-events-none after:z-[1] after:bg-gradient-to-t after:from-[var(--c-surface)] after:to-transparent">
        {/* selection highlight band */}
        <div
          class="absolute left-3 right-3 pointer-events-none border-y-[1.5px] border-[var(--c-divider)] rounded-[4px] bg-[var(--md-primary-container)] opacity-35 z-0"
          style={{ top: `${2 * ITEM_HEIGHT}px`, height: `${ITEM_HEIGHT}px` }}
        />

        <Show when={mode() !== 'time'}>
          <WheelColumn items={years()} selectedIndex={yearIdx()} onChange={handleYear} />
          <WheelColumn items={months} selectedIndex={st.month} onChange={handleMonth} />
          <WheelColumn items={days()} selectedIndex={st.day} onChange={handleDay} />
        </Show>

        <Show when={mode() !== 'date'}>
          <WheelColumn items={hours} selectedIndex={st.hour} onChange={handleHour} />
          <WheelColumn items={minutes} selectedIndex={st.minute} onChange={handleMinute} />
        </Show>
      </div>
    </div>
  )
}
