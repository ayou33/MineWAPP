import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import Icon from '@/components/Icon'
import Spin from '@/components/Spin'

export type SelectOption = {
  label: string
  value: string
}

type SelectProps = {
  /** Static array or an async function for lazy loading. The function result is cached after the first successful load. */
  options: SelectOption[] | (() => Promise<SelectOption[]>)
  /** Current value. Pass '' to indicate no selection. */
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  error?: boolean | string | null
  /** Show an × button on the trigger to reset to '' when a value is selected. */
  allowClear?: boolean
}

/** ms — must exceed CSS transition duration in dropdown-menu-panel (200ms) */
const CLOSE_DELAY = 220
/** Approximate height of search bar + top/bottom padding */
const PANEL_CHROME_H = 60
/** Hard cap on the options list height */
const OPTIONS_MAX_H = 216

type PanelPos = {
  top?: number
  bottom?: number
  left: number
  width: number
  optionsMaxH: number
  openUpward: boolean
}

/**
 * Single-select dropdown with search.
 *
 * Visual twin of DropdownSelector — reuses `dropdown-menu-panel` CSS class
 * for background, border, shadow, border-radius, and scaleY animation.
 * Panel is rendered via Portal to escape `overflow:hidden` ancestors.
 * Flips upward when there is insufficient space below the trigger.
 */
export default function Select (props: SelectProps) {
  const [mounted, setMounted] = createSignal(false)
  const [visible, setVisible] = createSignal(false)
  const [search, setSearch] = createSignal('')
  const [panelPos, setPanelPos] = createSignal<PanelPos | null>(null)
  const [asyncOptions, setAsyncOptions] = createSignal<SelectOption[]>([])
  const [loadingOptions, setLoadingOptions] = createSignal(false)
  const [asyncLoaded, setAsyncLoaded] = createSignal(false)

  let triggerRef: HTMLButtonElement | undefined
  let panelRef: HTMLDivElement | undefined
  let searchRef: HTMLInputElement | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined

  const allOptions = createMemo(() =>
    typeof props.options === 'function' ? asyncOptions() : (props.options as SelectOption[])
  )

  const filtered = createMemo(() => {
    const q = search().toLowerCase()
    const opts = allOptions()
    return q ? opts.filter(o => o.label.toLowerCase().includes(q)) : opts
  })

  const selectedLabel = createMemo(() =>
    allOptions().find(o => o.value === props.value)?.label ?? null,
  )

  async function loadOptions () {
    if (typeof props.options !== 'function' || asyncLoaded()) return
    setLoadingOptions(true)
    try {
      const result = await props.options()
      setAsyncOptions(result)
      setAsyncLoaded(true)
    } finally {
      setLoadingOptions(false)
    }
  }

  function openDropdown () {
    if (props.disabled) return
    clearTimeout(closeTimer)

    const rect = triggerRef!.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - 8
    const spaceAbove = rect.top - 8

    let pos: PanelPos
    if (spaceBelow >= PANEL_CHROME_H + 80 || spaceBelow >= spaceAbove) {
      const optionsMaxH = Math.min(OPTIONS_MAX_H, Math.max(80, spaceBelow - PANEL_CHROME_H))
      pos = { top: rect.bottom + 4, left: rect.left, width: rect.width, optionsMaxH, openUpward: false }
    } else {
      const optionsMaxH = Math.min(OPTIONS_MAX_H, Math.max(80, spaceAbove - PANEL_CHROME_H))
      pos = { bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width, optionsMaxH, openUpward: true }
    }

    setPanelPos(pos)
    setMounted(true)
    void loadOptions()
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setVisible(true)
      searchRef?.focus()
    }))
  }

  function closeDropdown () {
    if (!mounted()) return
    setVisible(false)
    setSearch('')
    props.onBlur?.()
    closeTimer = setTimeout(() => setMounted(false), CLOSE_DELAY)
  }

  function select (val: string) {
    props.onChange(val)
    closeDropdown()
  }

  function clearValue (e: MouseEvent) {
    e.stopPropagation()
    props.onChange('')
    props.onBlur?.()
  }

  createEffect(() => {
    if (!mounted()) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeDropdown() }
    }
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!triggerRef?.contains(target) && !panelRef?.contains(target)) closeDropdown()
    }
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as Node
      if (!triggerRef?.contains(target) && !panelRef?.contains(target)) closeDropdown()
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('focusin', onFocusIn)
    onCleanup(() => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('focusin', onFocusIn)
    })
  })

  onCleanup(() => clearTimeout(closeTimer))

  const borderColor = () =>
    props.error
      ? 'var(--c-input-outlined-border-error)'
      : mounted()
        ? 'var(--c-input-outlined-border-focus)'
        : 'var(--c-input-outlined-border)'

  const boxShadow = () =>
    mounted()
      ? props.error
        ? '0 0 0 3px color-mix(in srgb, var(--md-error) 20%, transparent)'
        : '0 0 0 3px var(--state-focus)'
      : 'none'

  const hasValue = () => props.value !== '' && props.value !== null && props.value !== undefined

  return (
    <div>

      {/* Trigger */}
      <button
        ref={el => { triggerRef = el }}
        type="button"
        class="w-full flex items-center justify-between px-4 py-3 text-sm rounded-xl border outline-none transition-[border-color,box-shadow] duration-150"
        classList={{
          'opacity-40 cursor-not-allowed pointer-events-none': !!props.disabled,
          'cursor-pointer': !props.disabled,
        }}
        style={{
          background: 'var(--c-input-outlined-bg)',
          'border-color': borderColor(),
          'box-shadow': boxShadow(),
        }}
        onClick={openDropdown}
        disabled={props.disabled}
      >
        <span class={`truncate ${hasValue() ? 'text-c-text' : 'text-[var(--c-input-placeholder)]'}`}>
          {selectedLabel() ?? (props.placeholder ?? '请选择')}
        </span>

        <span class="flex items-center gap-1 shrink-0 ml-2">
          <Show when={props.allowClear && hasValue()}>
            <span
              class="flex items-center rounded-full p-0.5 transition-colors hover:bg-[var(--state-hover)] cursor-pointer"
              onClick={clearValue}
            >
              <Icon name="close" set="mdi" size={12} color="var(--c-text-subtle)" />
            </span>
          </Show>
          <Icon
            name={mounted() ? 'chevron-up' : 'chevron-down'}
            set="mdi"
            size={16}
            color="var(--c-text-subtle)"
          />
        </span>
      </button>

      {/* Floating panel */}
      <Show when={mounted()}>
        <Portal mount={document.body}>
          <div
            ref={el => { panelRef = el }}
            class={`fixed dropdown-menu-panel${visible() ? ' dropdown-menu-panel--visible' : ''}`}
            style={{
              ...(panelPos()!.top !== undefined ? { top: `${panelPos()!.top}px` } : {}),
              ...(panelPos()!.bottom !== undefined ? { bottom: `${panelPos()!.bottom}px` } : {}),
              left: `${panelPos()!.left}px`,
              width: `${panelPos()!.width}px`,
              'transform-origin': panelPos()!.openUpward ? 'bottom center' : 'top center',
              'z-index': 'var(--z-index-dropdown)',
              'pointer-events': visible() ? 'auto' : 'none',
            }}
          >

            {/* Search */}
            <div class="p-2 border-b border-c-divider">
              <div class="relative flex items-center">
                <span class="absolute left-2.5 flex items-center pointer-events-none">
                  <Icon name="magnify" set="mdi" size={14} color="var(--c-text-subtle)" />
                </span>
                <input
                  ref={el => { searchRef = el }}
                  class="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border-0 outline-none bg-transparent text-c-text placeholder:text-[var(--c-input-placeholder)]"
                  placeholder="搜索..."
                  value={search()}
                  onInput={e => setSearch(e.currentTarget.value)}
                />
              </div>
            </div>

            {/* Options */}
            <div
              class="overflow-y-auto py-1.5"
              style={{ 'max-height': `${panelPos()!.optionsMaxH}px`, 'scrollbar-width': 'thin' }}
              onWheel={e => e.stopPropagation()}
            >
              <Show
                when={!loadingOptions()}
                fallback={
                  <div class="flex items-center justify-center py-6">
                    <Spin class="border-md-primary" />
                  </div>
                }
              >
              <Show
                when={filtered().length > 0}
                fallback={<p class="text-center text-xs text-c-text-subtle py-4">无匹配选项</p>}
              >
                <For each={filtered()}>
                  {(opt) => {
                    const active = () => opt.value === props.value
                    return (
                      <div
                        class="flex items-center justify-between px-3 mx-1.5 h-10 rounded-lg cursor-pointer select-none transition-colors duration-100"
                        classList={{
                          'hover:bg-c-dropdown-item-hover': !active(),
                          'bg-c-dropdown-item-active-bg': active(),
                          'text-c-dropdown-item-active-text': active(),
                        }}
                        onClick={() => select(opt.value)}
                      >
                        <span class="text-sm truncate flex-1">{opt.label}</span>
                        <Show when={active()}>
                          <Icon name="check" set="mdi" size={14} color="var(--md-primary)" class="shrink-0 ml-2" />
                        </Show>
                      </div>
                    )
                  }}
                </For>
              </Show>
              </Show>
            </div>

          </div>
        </Portal>
      </Show>

    </div>
  )
}
