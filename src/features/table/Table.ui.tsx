import classNames from 'classnames'
import { createEffect, createSignal, For, Show } from 'solid-js'

const PAGE_INLINE_THRESHOLD = 7
const PAGE_SIBLING_COUNT = 1
const PAGE_EDGE_GAP = 2

// --- Checkbox ----------------------------------------------------------------

type CheckboxProps = {
  checked: boolean
  indeterminate?: boolean
  onChange: (e: Event) => void
  class?: string
}

export function Checkbox (props: CheckboxProps) {
  let inputEl: HTMLInputElement | null = null
  createEffect(() => { if (inputEl) inputEl.indeterminate = props.indeterminate ?? false })
  return (
    <input
      ref={el => { inputEl = el }}
      type="checkbox"
      checked={props.checked}
      onChange={props.onChange}
      class={classNames('w-4 h-4 cursor-pointer accent-md-primary', props.class)}
    />
  )
}

// --- SortIcon ----------------------------------------------------------------

export function SortIcon (props: { dir: 'asc' | 'desc' | null }) {
  return (
    <span class="inline-flex flex-col gap-px ml-0.5 shrink-0">
      <svg class={classNames('w-2 h-2 transition-colors', props.dir === 'asc' ? 'text-md-primary' : 'text-c-text-subtle')} viewBox="0 0 8 5" fill="currentColor">
        <path d="M4 0L8 5H0L4 0Z" />
      </svg>
      <svg class={classNames('w-2 h-2 transition-colors', props.dir === 'desc' ? 'text-md-primary' : 'text-c-text-subtle')} viewBox="0 0 8 5" fill="currentColor">
        <path d="M4 5L0 0H8L4 5Z" />
      </svg>
    </span>
  )
}

// --- PinIcon -----------------------------------------------------------------
// Bootstrap Icons "pin-fill" (active) and "pin-angle" (inactive)

export function PinIcon (props: { active: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      {props.active
        ? <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5H9v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10H4.5a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354z" />
        : <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375l-.508.508a.5.5 0 0 1-.707 0l-2.088-2.087-2.617 2.617a.5.5 0 0 1-.707-.708l2.617-2.617-2.088-2.088a.5.5 0 0 1 0-.707l.508-.508c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z" />
      }
    </svg>
  )
}

// --- Pagination helpers ------------------------------------------------------

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

// --- Pagination --------------------------------------------------------------

export type PaginationProps = {
  page: () => number
  pageSize: () => number
  total: () => number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions: number[]
}

export function Pagination (props: PaginationProps) {
  const totalPages = () => Math.max(1, Math.ceil(props.total() / props.pageSize()))
  const [jumpInput, setJumpInput] = createSignal('')
  const sizeOptions = () =>
    [...new Set([...props.pageSizeOptions, props.pageSize()])].sort((a, b) => a - b)
  const doJump = () => {
    const n = parseInt(jumpInput(), 10)
    if (!isNaN(n)) { props.onPageChange(Math.max(1, Math.min(n, totalPages()))); setJumpInput('') }
  }

  return (
    <div class="flex items-center justify-between gap-4 px-5 py-3 border-t border-c-table-border text-sm text-c-text-muted select-none flex-wrap">
      <div class="flex items-center gap-3 shrink-0">
        <span>共 {props.total()} 条</span>
        <select
          value={props.pageSize()}
          onChange={e => props.onPageSizeChange(parseInt((e.currentTarget as HTMLSelectElement).value, 10))}
          class="h-7 px-2 rounded text-xs bg-c-surface text-c-text-muted cursor-pointer outline-none transition-colors hover:bg-c-table-row-hover"
          style={{ border: '1px solid var(--c-outline)' }}
          aria-label="每页条数"
        >
          <For each={sizeOptions()}>{size => <option value={size}>{size} 条/页</option>}</For>
        </select>
      </div>

      <div class="flex items-center gap-1">
        <button
          class="px-2 py-1 rounded hover:bg-c-table-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          disabled={props.page() <= 1}
          onClick={() => props.onPageChange(props.page() - 1)}
          aria-label="Previous page"
        >&lsaquo;</button>

        <For each={buildPageNumbers(props.page(), totalPages())}>
          {item => (
            <Show when={item !== null} fallback={<span class="px-1 text-c-text-subtle">...</span>}>
              <button
                class={classNames('min-w-8 h-8 px-1 rounded text-sm transition-colors', item === props.page() ? 'text-white' : 'hover:bg-c-table-row-hover text-c-text-muted')}
                style={item === props.page() ? { background: 'var(--md-primary)' } : {}}
                onClick={() => props.onPageChange(item!)}
                aria-current={item === props.page() ? 'page' : undefined}
              >{item}</button>
            </Show>
          )}
        </For>

        <button
          class="px-2 py-1 rounded hover:bg-c-table-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          disabled={props.page() >= totalPages()}
          onClick={() => props.onPageChange(props.page() + 1)}
          aria-label="Next page"
        >&rsaquo;</button>

        <div class="flex items-center gap-1 ml-2">
          <span class="shrink-0">跳至</span>
          <input
            type="text"
            inputmode="numeric"
            value={jumpInput()}
            onInput={e => setJumpInput((e.currentTarget as HTMLInputElement).value)}
            onKeyDown={e => e.key === 'Enter' && doJump()}
            placeholder={String(props.page())}
            class="w-12 h-7 px-2 rounded text-xs text-center bg-c-surface text-c-text outline-none transition-colors"
            style={{ border: '1px solid var(--c-outline)' }}
            aria-label="跳转页码"
          />
          <button
            onClick={doJump}
            class="h-7 px-2 rounded text-xs transition-colors hover:bg-c-table-row-hover"
            style={{ border: '1px solid var(--c-outline)' }}
          >跳转</button>
        </div>
      </div>
    </div>
  )
}
