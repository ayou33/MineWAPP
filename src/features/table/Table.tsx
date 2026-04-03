import classNames from 'classnames'
import { createEffect, createMemo, For, Show } from 'solid-js'
import type { ColumnDef, TableState } from './types'

// Threshold below which all page buttons are shown inline
const PAGE_INLINE_THRESHOLD = 7
// Siblings around current page in compact mode
const PAGE_SIBLING_COUNT = 1
// Minimum distance from edge before an ellipsis appears
const PAGE_EDGE_GAP = 2

// --- Indeterminate Checkbox -------------------------------------------------

type CheckboxProps = {
  checked: boolean
  indeterminate?: boolean
  onChange: (e: Event) => void
  class?: string
}

function Checkbox (props: CheckboxProps) {
  let inputEl: HTMLInputElement | null = null
  createEffect(() => {
    if (inputEl) inputEl.indeterminate = props.indeterminate ?? false
  })
  return (
    <input
      ref={el => { inputEl = el }}
      type="checkbox"
      checked={props.checked}
      onChange={props.onChange}
      class={classNames('w-4 h-4 accent-blue cursor-pointer', props.class)}
    />
  )
}

// --- Sort Icon --------------------------------------------------------------

function SortIcon (props: { dir: 'asc' | 'desc' | null }) {
  return (
    <span class="inline-flex flex-col gap-px ml-0.5 shrink-0">
      <svg
        class={classNames('w-2 h-2', props.dir === 'asc' ? 'text-blue' : 'text-gray-lighter')}
        viewBox="0 0 8 5"
        fill="currentColor"
      >
        <path d="M4 0L8 5H0L4 0Z" />
      </svg>
      <svg
        class={classNames('w-2 h-2', props.dir === 'desc' ? 'text-blue' : 'text-gray-lighter')}
        viewBox="0 0 8 5"
        fill="currentColor"
      >
        <path d="M4 5L0 0H8L4 5Z" />
      </svg>
    </span>
  )
}

// --- Pagination -------------------------------------------------------------

type PaginationProps = {
  page: () => number
  pageSize: () => number
  total: () => number
  onPageChange: (page: number) => void
}

function buildPageNumbers (current: number, total: number): (number | null)[] {
  if (total <= PAGE_INLINE_THRESHOLD) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | null)[] = [1]
  if (current > PAGE_EDGE_GAP + 1) pages.push(null)
  for (let i = Math.max(2, current - PAGE_SIBLING_COUNT); i <= Math.min(total - 1, current + PAGE_SIBLING_COUNT); i++) {
    pages.push(i)
  }
  if (current < total - PAGE_EDGE_GAP) pages.push(null)
  pages.push(total)
  return pages
}

function Pagination (props: PaginationProps) {
  const totalPages = () => Math.max(1, Math.ceil(props.total() / props.pageSize()))
  const from = () => (props.page() - 1) * props.pageSize() + 1
  const to = () => Math.min(props.page() * props.pageSize(), props.total())

  return (
    <div class="flex items-center justify-between gap-4 px-4 py-3 border-t border-gray-100 text-sm text-gray select-none">
      <span class="shrink-0">{from()} - {to()} / {props.total()}</span>
      <div class="flex items-center gap-1">
        <button
          class="px-2 py-1 rounded hover:bg-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          disabled={props.page() <= 1}
          onClick={() => props.onPageChange(props.page() - 1)}
          aria-label="Previous page"
        >
          &lsaquo;
        </button>
        <For each={buildPageNumbers(props.page(), totalPages())}>
          {item => (
            <Show when={item !== null} fallback={<span class="px-1">...</span>}>
              <button
                class={classNames(
                  'min-w-8 h-8 px-1 rounded text-sm transition-colors',
                  item === props.page() ? 'bg-blue text-white' : 'hover:bg-bg text-gray',
                )}
                onClick={() => props.onPageChange(item!)}
                aria-current={item === props.page() ? 'page' : undefined}
              >
                {item}
              </button>
            </Show>
          )}
        </For>
        <button
          class="px-2 py-1 rounded hover:bg-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          disabled={props.page() >= totalPages()}
          onClick={() => props.onPageChange(props.page() + 1)}
          aria-label="Next page"
        >
          &rsaquo;
        </button>
      </div>
    </div>
  )
}

// --- Table ------------------------------------------------------------------

export type TableProps<T extends Record<string, unknown>> = {
  table: TableState<T>
  /** Stick the header to the top of the scroll container (default: true) */
  stickyHeader?: boolean
  /** Show a loading overlay */
  loading?: () => boolean
  /** Extra class names on the outer wrapper */
  class?: string
  /** Placeholder shown when there are no rows */
  emptyText?: string
}

export default function Table<T extends Record<string, unknown>> (props: TableProps<T>) {
  const t = props.table

  const hasFilters = createMemo(() => t.columns.some(c => c.filterable))
  const colSpan = createMemo(() => t.columns.length + (t.hasSelection ? 1 : 0))
  const stickyHeader = () => props.stickyHeader !== false

  function alignClass (align?: 'left' | 'center' | 'right') {
    if (align === 'center') return 'text-center'
    if (align === 'right') return 'text-right'
    return 'text-left'
  }

  function fixedClass (fixed?: 'left' | 'right') {
    if (fixed === 'left') return 'sticky left-0'
    if (fixed === 'right') return 'sticky right-0'
    return ''
  }

  function cellStyle (col: ColumnDef<T>): Record<string, string> {
    const s: Record<string, string> = {}
    if (col.width !== undefined && col.width !== null) {
      s.width = typeof col.width === 'number' ? `${col.width}px` : String(col.width)
    }
    return s
  }

  return (
    <div class={classNames('relative overflow-auto rounded-lg border border-gray-100', props.class)}>

      {/* Loading overlay */}
      <Show when={props.loading?.()}>
        <div class="absolute inset-0 bg-white/70 flex items-center justify-center z-system">
          <div class="w-7 h-7 border-2 border-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </Show>

      <table class="w-full border-collapse text-sm text-black">

        {/* Header */}
        <thead>
          <tr class={classNames('bg-bg text-gray', stickyHeader() && 'sticky top-0 z-popup')}>
            <Show when={t.hasSelection}>
              <th class="px-3 py-3 w-10 bg-bg">
                <Checkbox
                  checked={t.isAllSelected()}
                  indeterminate={t.isIndeterminate()}
                  onChange={t.toggleSelectAll}
                />
              </th>
            </Show>
            <For each={t.columns}>
              {col => (
                <th
                  class={classNames(
                    'px-4 py-3 font-medium whitespace-nowrap bg-bg',
                    alignClass(col.align),
                    fixedClass(col.fixed),
                    col.fixed && 'z-focus',
                    col.sortable && 'cursor-pointer select-none hover:text-black',
                  )}
                  style={cellStyle(col)}
                  onClick={() => col.sortable && t.setSort(col.key)}
                >
                  <span class="inline-flex items-center gap-0.5">
                    {col.title}
                    <Show when={col.sortable}>
                      <SortIcon dir={t.sort()?.key === col.key ? t.sort()!.dir : null} />
                    </Show>
                  </span>
                </th>
              )}
            </For>
          </tr>

          {/* Filter row */}
          <Show when={hasFilters()}>
            <tr class="bg-bg border-t border-gray-100">
              <Show when={t.hasSelection}>
                <td class="px-3 py-2 bg-bg" />
              </Show>
              <For each={t.columns}>
                {col => (
                  <td
                    class={classNames('px-4 py-2 bg-bg', fixedClass(col.fixed), col.fixed && 'z-focus')}
                    style={cellStyle(col)}
                  >
                    <Show when={col.filterable}>
                      <input
                        type="text"
                        value={t.filters()[col.key] ?? ''}
                        onInput={e => t.setFilter(col.key, (e.currentTarget as HTMLInputElement).value)}
                        placeholder="Filter..."
                        class="w-full px-2 py-1 text-xs rounded border border-gray-100 bg-white focus:outline-none focus:border-blue placeholder:text-gray-lighter"
                      />
                    </Show>
                  </td>
                )}
              </For>
            </tr>
          </Show>
        </thead>

        {/* Body */}
        <tbody>
          <Show
            when={t.displayData().length > 0}
            fallback={
              <tr>
                <td colspan={colSpan()} class="px-4 py-10 text-center text-gray-light">
                  {props.emptyText ?? 'No data'}
                </td>
              </tr>
            }
          >
            <For each={t.displayData()}>
              {(row, index) => {
                const key = t.rowKey(row)
                const isSelected = () => t.selectedKeys().includes(key)

                return (
                  <tr
                    class={classNames(
                      'border-t border-gray-100 transition-colors',
                      isSelected() ? 'bg-blue-3lighter' : 'hover:bg-bg',
                    )}
                  >
                    <Show when={t.hasSelection}>
                      <td class={classNames('px-3 py-3 w-10', isSelected() ? 'bg-blue-3lighter' : 'bg-white')}>
                        <Checkbox checked={isSelected()} onChange={() => t.toggleSelect(key)} />
                      </td>
                    </Show>
                    <For each={t.columns}>
                      {col => (
                        <td
                          class={classNames(
                            'px-4 py-3',
                            alignClass(col.align),
                            fixedClass(col.fixed),
                            col.fixed && 'z-focus',
                            col.fixed && (isSelected() ? 'bg-blue-3lighter' : 'bg-white'),
                          )}
                          style={cellStyle(col)}
                        >
                          {col.render
                            ? col.render(row[col.key as keyof T & string], row, index())
                            : String(row[col.key] ?? '')}
                        </td>
                      )}
                    </For>
                  </tr>
                )
              }}
            </For>
          </Show>
        </tbody>
      </table>

      {/* Pagination */}
      <Show when={t.hasPagination && t.total() > 0}>
        <Pagination
          page={t.page}
          pageSize={t.pageSize}
          total={t.total}
          onPageChange={t.setPage}
        />
      </Show>
    </div>
  )
}