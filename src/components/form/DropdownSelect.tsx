import { createEffect, createSignal, For, JSX, onCleanup, Show } from 'solid-js'
import Icon from '@/components/Icon'

export type SelectOption<V extends string = string> = {
  value: V
  label: string
}

type Props<V extends string = string> = {
  options: SelectOption<V>[]
  value: V[]
  onChange: (values: V[]) => void
  onBlur?: () => void
  placeholder?: string
  error?: boolean | string | null
  disabled?: boolean
  class?: string
}

export default function DropdownSelect<V extends string = string> (props: Props<V>): JSX.Element {
  const [open, setOpen] = createSignal(false)
  const [search, setSearch] = createSignal('')
  let containerRef: HTMLDivElement | undefined
  let searchRef: HTMLInputElement | undefined

  const filtered = () => {
    const q = search().toLowerCase()
    if (!q) return props.options
    return props.options.filter(o => o.label.toLowerCase().includes(q))
  }

  const isSelected = (v: V) => props.value.includes(v)

  function toggle (v: V) {
    const next = isSelected(v)
      ? props.value.filter(x => x !== v)
      : [...props.value, v]
    props.onChange(next as V[])
  }

  function openDropdown () {
    if (props.disabled) return
    setOpen(true)
    requestAnimationFrame(() => searchRef?.focus())
  }

  function closeDropdown () {
    setOpen(false)
    setSearch('')
    props.onBlur?.()
  }

  // Close on outside mousedown
  createEffect(() => {
    if (!open()) return
    function onDoc (e: MouseEvent) {
      if (!containerRef?.contains(e.target as Node)) closeDropdown()
    }
    document.addEventListener('mousedown', onDoc)
    onCleanup(() => document.removeEventListener('mousedown', onDoc))
  })

  // Close on Escape
  createEffect(() => {
    if (!open()) return
    function onKey (e: KeyboardEvent) {
      if (e.key === 'Escape') closeDropdown()
    }
    document.addEventListener('keydown', onKey)
    onCleanup(() => document.removeEventListener('keydown', onKey))
  })

  const hasError = () => Boolean(props.error)

  const triggerBorderStyle = () => ({
    'border-color': hasError()
      ? 'var(--c-input-outlined-border-error)'
      : open()
        ? 'var(--c-input-outlined-border-focus)'
        : 'var(--c-input-outlined-border)',
    'box-shadow': open()
      ? hasError()
        ? '0 0 0 3px rgba(246,77,75,0.15)'
        : '0 0 0 3px var(--state-focus)'
      : 'none',
  })

  return (
    <div ref={el => (containerRef = el)} class={`relative ${props.class ?? ''}`}>

      {/* ── Trigger button ── */}
      <button
        type="button"
        disabled={props.disabled}
        onClick={openDropdown}
        class="w-full min-h-[46px] px-3 py-2 text-sm rounded-xl border text-left
               flex flex-wrap items-center gap-1.5
               transition-[border-color,box-shadow] duration-150
               disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        style={{
          background: 'var(--c-input-outlined-bg)',
          ...triggerBorderStyle(),
        }}
      >
        <Show
          when={props.value.length > 0}
          fallback={
            <span class="px-1" style={{ color: 'var(--c-input-placeholder)' }}>
              {props.placeholder ?? '请选择'}
            </span>
          }
        >
          <For each={props.value}>
            {(v) => {
              const label = () => props.options.find(o => o.value === v)?.label ?? v
              return (
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                  style={{
                    background: 'var(--c-chip-selected-bg)',
                    color: 'var(--c-chip-selected-text)',
                  }}
                >
                  {label()}
                  <span
                    class="flex items-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                    onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); toggle(v) }}
                  >
                    <Icon name="close" set="mdi" size={9} color="currentColor" />
                  </span>
                </span>
              )
            }}
          </For>
        </Show>

        {/* Chevron — always at the right */}
        <span
          class="ml-auto pl-1 shrink-0 transition-transform duration-200"
          style={{
            transform: open() ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--c-text-subtle)',
          }}
        >
          <Icon name="chevron-down" set="mdi" size={16} color="currentColor" />
        </span>
      </button>

      {/* ── Dropdown panel ── */}
      <Show when={open()}>
        <div
          class="absolute left-0 right-0 top-full mt-1.5 rounded-xl border overflow-hidden"
          style={{
            background: 'var(--c-dropdown-bg)',
            'border-color': 'var(--c-dropdown-border)',
            'box-shadow': 'var(--md-shadow-md)',
            'z-index': 'var(--z-index-dropdown)',
          }}
        >

          {/* Search input */}
          <div class="p-2 border-b" style={{ 'border-color': 'var(--c-dropdown-border)' }}>
            <div class="relative flex items-center">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Icon name="magnify" set="mdi" size={14} color="var(--c-text-subtle)" />
              </span>
              <input
                ref={el => (searchRef = el)}
                class="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border outline-none
                       transition-[border-color,box-shadow] duration-150"
                style={{
                  background: 'var(--c-input-outlined-bg)',
                  'border-color': 'var(--c-input-outlined-border)',
                  color: 'var(--c-text)',
                }}
                placeholder="搜索..."
                value={search()}
                onInput={e => setSearch(e.currentTarget.value)}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'var(--c-input-outlined-border-focus)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--state-focus)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'var(--c-input-outlined-border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>

          {/* Options list */}
          <div class="max-h-48 overflow-y-auto py-1" style={{ 'scrollbar-width': 'thin' }}>
            <Show
              when={filtered().length > 0}
              fallback={
                <div class="px-4 py-3 text-sm text-center" style={{ color: 'var(--c-text-subtle)' }}>
                  无匹配结果
                </div>
              }
            >
              <For each={filtered()}>
                {(opt) => {
                  const selected = () => isSelected(opt.value)
                  return (
                    <button
                      type="button"
                      class="w-full flex items-center gap-2.5 px-3 py-2 text-sm border-0 text-left
                             cursor-pointer transition-colors duration-100"
                      style={{
                        background: selected() ? 'var(--c-dropdown-item-active-bg)' : 'transparent',
                        color: selected() ? 'var(--c-dropdown-item-active-text)' : 'var(--c-text)',
                      }}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => toggle(opt.value)}
                      onMouseEnter={e => {
                        if (!selected()) e.currentTarget.style.background = 'var(--c-dropdown-item-hover)'
                      }}
                      onMouseLeave={e => {
                        if (!selected()) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      {/* Checkbox */}
                      <span
                        class="w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors duration-100"
                        style={{
                          background: selected() ? 'var(--md-primary)' : 'transparent',
                          'border-color': selected() ? 'var(--md-primary)' : 'var(--c-outline)',
                        }}
                      >
                        <Show when={selected()}>
                          <Icon name="check" set="mdi" size={10} color="white" />
                        </Show>
                      </span>
                      {opt.label}
                    </button>
                  )
                }}
              </For>
            </Show>
          </div>

          {/* Footer: selected count + clear all */}
          <Show when={props.value.length > 0}>
            <div
              class="flex items-center justify-between px-3 py-2 border-t text-xs"
              style={{
                'border-color': 'var(--c-dropdown-border)',
                color: 'var(--c-text-muted)',
              }}
            >
              <span>已选 {props.value.length} 项</span>
              <button
                type="button"
                class="border-0 bg-transparent p-0 text-xs cursor-pointer transition-colors duration-150
                       hover:text-[var(--md-error)]"
                style={{ color: 'var(--c-text-muted)' }}
                onMouseDown={e => e.preventDefault()}
                onClick={() => props.onChange([])}
              >
                清除全部
              </button>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  )
}
