import { createEffect, createMemo, createSignal, For, JSXElement, onCleanup, Show } from 'solid-js'
import classNames from 'classnames'
import Icon from '@/components/Icon'
import Spin from '@/components/Spin'

/** ms — must exceed CSS transition duration in dropdown-menu-panel (200ms) */
const CLOSE_DELAY = 220

export type SearchBoxProps<T extends Record<string, unknown>> = {
  /** Static data array OR async function that fetches items for the given query. */
  data: T[] | ((query: string) => Promise<T[]>)
  /** Render function for each result item. Receives the item and current query string. */
  children: (item: T, query: string) => JSXElement
  /** Extra CSS class(es) applied to the result panel. */
  panelClass?: string
  /** Field names to match against; when omitted every string-able field is searched. */
  fields?: (keyof T)[]
  placeholder?: string
  /** Debounce delay in ms — only applies to async data mode (default: 300). */
  debounce?: number
  /** Called when the user selects a result item. */
  onSelect?: (item: T) => void
  /**
   * Field whose value is placed in the input after selection.
   * When omitted the input is cleared on selection.
   */
  displayField?: keyof T
}

function matchesQuery<T extends Record<string, unknown>> (
  item: T,
  query: string,
  fields?: (keyof T)[],
): boolean {
  const q = query.toLowerCase()
  const keys = (fields ?? Object.keys(item)) as (keyof T)[]
  return keys.some(k => {
    const v = item[k]
    return v !== null && v !== undefined && String(v).toLowerCase().includes(q)
  })
}

/**
 * Generic search-box component.
 *
 * - `data` accepts a static array **or** an async function `(query) => Promise<T[]>`.
 * - `children` is a render-prop function: `(item, query) => JSXElement`.
 * - `panelClass` adds extra classes to the floating result panel.
 * - `fields` restricts which object keys are matched; omit to search all fields.
 */
export default function SearchBox<T extends Record<string, unknown>> (
  props: SearchBoxProps<T>,
) {
  const [query, setQuery] = createSignal('')
  const [asyncResults, setAsyncResults] = createSignal<T[]>([])
  const [loading, setLoading] = createSignal(false)
  const [mounted, setMounted] = createSignal(false)
  const [visible, setVisible] = createSignal(false)

  let wrapRef: HTMLDivElement | undefined
  let inputRef: HTMLInputElement | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  const isAsync = () => typeof props.data === 'function'

  // Static data: filter synchronously in a memo.
  const staticResults = createMemo<T[]>(() => {
    if (isAsync()) return []
    const q = query()
    if (!q) return []
    return (props.data as T[]).filter(item => matchesQuery(item, q, props.fields))
  })

  // Async data: debounced fetch whenever the query changes.
  createEffect(() => {
    if (!isAsync()) return
    const q = query()
    clearTimeout(debounceTimer)
    if (!q) {
      setAsyncResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceTimer = setTimeout(() => {
      ;(props.data as (query: string) => Promise<T[]>)(q)
        .then(res => {
          setAsyncResults(res)
          setLoading(false)
        })
        .catch(() => {
          setAsyncResults([])
          setLoading(false)
        })
    }, props.debounce ?? 300)
  })

  const results = (): T[] => isAsync() ? asyncResults() : staticResults()

  // --- Panel open / close ---------------------------------------------------

  function openPanel () {
    clearTimeout(closeTimer)
    setMounted(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
  }

  function closePanel () {
    if (!mounted()) return
    setVisible(false)
    closeTimer = setTimeout(() => setMounted(false), CLOSE_DELAY)
  }

  function handleInput (e: InputEvent) {
    const val = (e.currentTarget as HTMLInputElement).value
    setQuery(val)
    if (val) openPanel()
    else closePanel()
  }

  function handleFocus () {
    if (query()) openPanel()
  }

  function clearQuery () {
    setQuery('')
    setAsyncResults([])
    setLoading(false)
    closePanel()
    inputRef?.focus()
  }

  function handleSelect (item: T) {
    if (props.displayField !== undefined) {
      const display = String(item[props.displayField] ?? '')
      setQuery(display)
      if (inputRef) inputRef.value = display
    }
    // else: keep whatever the user typed
    setAsyncResults([])
    props.onSelect?.(item)
    closePanel()
  }

  // Close on outside click or Escape key.
  createEffect(() => {
    if (!mounted()) return
    const onMouseDown = (e: MouseEvent) => {
      if (!wrapRef?.contains(e.target as Node)) closePanel()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    onCleanup(() => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    })
  })

  onCleanup(() => {
    clearTimeout(closeTimer)
    clearTimeout(debounceTimer)
  })

  // --- Render ---------------------------------------------------------------

  return (
    <div ref={el => { wrapRef = el }} class="relative w-full">

      {/* Input */}
      <div class="relative flex items-center">
        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
          <Icon name="search" set="mdi" size={16} color="var(--c-text-subtle)" />
        </span>

        <input
          ref={el => { inputRef = el }}
          type="text"
          value={query()}
          onInput={handleInput}
          onFocus={handleFocus}
          placeholder={props.placeholder ?? '搜索…'}
          class="w-full pl-10 pr-10 py-3 text-sm rounded-xl border bg-c-input-outlined-bg text-c-text placeholder:text-c-input-placeholder border-c-input-outlined-border focus:border-(--c-input-outlined-border-focus) focus:shadow-[0_0_0_3px_var(--state-focus)] outline-none transition-[border-color,box-shadow] duration-150"
        />

        <span class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Show when={loading()}>
            <Spin class="border-md-primary" />
          </Show>
          <Show when={!loading() && !!query()}>
            <button
              type="button"
              class="flex items-center rounded-full p-0.5 transition-colors hover:bg-(--state-hover) cursor-pointer"
              onMouseDown={e => { e.preventDefault(); clearQuery() }}
            >
              <Icon name="close" set="mdi" size={14} color="var(--c-text-subtle)" />
            </button>
          </Show>
        </span>
      </div>

      {/* Results panel */}
      <Show when={mounted()}>
        <div
          class={classNames(
            'absolute z-50 w-full mt-1 dropdown-menu-panel',
            visible() && 'dropdown-menu-panel--visible',
            props.panelClass,
          )}
        >
          <div class="overflow-y-auto max-h-64">
          <Show
            when={results().length > 0}
            fallback={
              <Show when={!loading()}>
                <div class="px-4 py-3 text-sm text-center text-c-text-muted">
                  无匹配结果
                </div>
              </Show>
            }
          >
            <ul>
              <For each={results()}>
                {item => (
                  <li
                    class="cursor-pointer transition-colors hover:bg-c-dropdown-item-hover active:bg-c-dropdown-item-active-bg"
                    onMouseDown={e => { e.preventDefault(); handleSelect(item) }}
                  >
                    {(props.children as (item: T, query: string) => JSXElement)(item, query())}
                  </li>
                )}
              </For>
            </ul>
          </Show>
          </div>
        </div>
      </Show>

    </div>
  )
}
