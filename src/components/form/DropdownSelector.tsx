import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import Icon from '@/components/Icon'

export type DropdownOption = {
  label: string
  value: string
}

type DropdownSelectorProps = {
  options: DropdownOption[]
  value: string[]
  onChange: (v: string[]) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  error?: boolean | string | null
}

/** ms — must exceed CSS transition duration in dropdown-menu-panel (200ms) */
const CLOSE_DELAY = 220
/** Approx height of search bar + footer + padding  */
const PANEL_CHROME_H = 108
/** Hard cap on the options list height */
const OPTIONS_MAX_H = 192

type PanelPos = {
  top?: number
  bottom?: number
  left: number
  width: number
  optionsMaxH: number
  openUpward: boolean
}

/**
 * Multi-select dropdown with search.
 *
 * - Visually identical to DropdownMenu: reuses `dropdown-menu-panel` CSS class
 *   for background, border, shadow, border-radius and scaleY open/close animation.
 * - Panel rendered via Portal to escape `overflow:hidden` ancestors.
 * - Flips upward automatically when there is insufficient space below the trigger.
 */
export default function DropdownSelector (props: DropdownSelectorProps) {
  const [mounted, setMounted] = createSignal(false)
  const [visible, setVisible] = createSignal(false)
  const [search, setSearch] = createSignal('')
  const [panelPos, setPanelPos] = createSignal<PanelPos | null>(null)

  let triggerRef: HTMLButtonElement | undefined
  let panelRef: HTMLDivElement | undefined
  let searchRef: HTMLInputElement | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined

  const filtered = createMemo(() => {
    const q = search().toLowerCase()
    return q ? props.options.filter(o => o.label.toLowerCase().includes(q)) : props.options
  })

  const displayText = createMemo(() => {
    if (props.value.length === 0) return null
    if (props.value.length <= 2)
      return props.value.map(v => props.options.find(o => o.value === v)?.label ?? v).join('、')
    return `${props.value.length} 个已选`
  })

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
    // Double-RAF: let panel mount into DOM before triggering CSS transition
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

  function toggle (val: string) {
    props.onChange(
      props.value.includes(val)
        ? props.value.filter(v => v !== val)
        : [...props.value, val],
    )
  }

  // Close on: Escape key / click outside / focus leaving both trigger and panel
  createEffect(() => {
    if (!mounted()) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeDropdown() }
    }

    // mousedown (not click) so it fires before focus shifts
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!triggerRef?.contains(target) && !panelRef?.contains(target)) closeDropdown()
    }

    // focusin catches Tab-key navigation away from the component
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

  onCleanup(() => {
    clearTimeout(closeTimer)
  })

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

  return (
    <div>

      {/* Trigger button */}
      <button
        ref={el => { triggerRef = el }}
        type="button"
        class="w-full flex items-center justify-between px-4 py-3 text-sm rounded-xl border outline-none transition-[border-color,box-shadow] duration-150"
        classList={{ 'opacity-40 cursor-not-allowed pointer-events-none': !!props.disabled, 'cursor-pointer': !props.disabled }}
        style={{
          background: 'var(--c-input-outlined-bg)',
          'border-color': borderColor(),
          'box-shadow': boxShadow(),
        }}
        onClick={openDropdown}
        disabled={props.disabled}
      >
        <span class={`truncate ${props.value.length > 0 ? 'text-c-text' : 'text-[var(--c-input-placeholder)]'}`}>
          {displayText() ?? (props.placeholder ?? '请选择')}
        </span>
        <Icon
          name={mounted() ? 'chevron-up' : 'chevron-down'}
          set="mdi"
          size={16}
          color="var(--c-text-subtle)"
          class="shrink-0 ml-2"
        />
      </button>

      <Show when={mounted()}>
        <Portal mount={document.body}>

          {/* Panel — reuses dropdown-menu-panel for bg/border/shadow/radius/animation */}
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
                when={filtered().length > 0}
                fallback={<p class="text-center text-xs text-c-text-subtle py-4">无匹配选项</p>}
              >
                <For each={filtered()}>
                  {(opt) => {
                    const checked = () => props.value.includes(opt.value)
                    return (
                      <div
                        class="flex items-center gap-3 px-3 mx-1.5 h-10 rounded-lg cursor-pointer select-none transition-colors duration-100"
                        classList={{
                          'hover:bg-c-dropdown-item-hover': !checked(),
                          'bg-c-dropdown-item-active-bg': checked(),
                          'text-c-dropdown-item-active-text': checked(),
                        }}
                        onClick={() => toggle(opt.value)}
                      >
                        <div
                          class="w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-all duration-100"
                          style={{
                            background: checked() ? 'var(--md-primary)' : 'transparent',
                            'border-color': checked() ? 'var(--md-primary)' : 'var(--c-outline)',
                          }}
                        >
                          <Show when={checked()}>
                            <Icon name="check" set="mdi" size={11} color="white" />
                          </Show>
                        </div>
                        <span class="text-sm truncate flex-1">{opt.label}</span>
                      </div>
                    )
                  }}
                </For>
              </Show>
            </div>

            {/* Footer: count + clear */}
            <Show when={props.value.length > 0}>
              <div class="flex items-center justify-between px-3 py-2 border-t border-c-divider">
                <span class="text-xs text-c-text-muted">已选 {props.value.length} 项</span>
                <button
                  type="button"
                  class="text-xs cursor-pointer border-0 bg-transparent p-0 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--md-error)' }}
                  onClick={() => props.onChange([])}
                >
                  清空
                </button>
              </div>
            </Show>

          </div>
        </Portal>
      </Show>
    </div>
  )
}
