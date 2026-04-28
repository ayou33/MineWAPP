import classNames from 'classnames'
import { createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import type { JSX, JSXElement } from 'solid-js'
import { Portal } from 'solid-js/web'
import {
  ChevronDownIcon, DotsVerticalIcon, FilterActiveIcon,
  GroupIcon, PinIcon, ResetIcon,
} from './Table.ui'
import type { ColumnDef, TableState } from './types'

// ── Constants ─────────────────────────────────────────────────────────────────

const POPOVER_MENU_WIDTH = 224
const POPOVER_VIEWPORT_PADDING = 8
const POPOVER_OFFSET_Y = 4
const MAX_COL_VALUES = 60

// ── Popover ───────────────────────────────────────────────────────────────────

type PopoverProps = {
  triggerRect: DOMRect
  onClose: () => void
  children: JSXElement
}

function Popover (props: PopoverProps) {
  let popoverEl: HTMLDivElement | null = null

  const style = (): JSX.CSSProperties => {
    const r = props.triggerRect
    const winW = window.innerWidth
    const left = Math.min(Math.max(POPOVER_VIEWPORT_PADDING, r.left), winW - POPOVER_MENU_WIDTH - POPOVER_VIEWPORT_PADDING)
    return { position: 'fixed', top: `${r.bottom + POPOVER_OFFSET_Y}px`, left: `${left}px`, 'z-index': '9999', 'min-width': `${POPOVER_MENU_WIDTH}px` }
  }

  const handleMouseDown = (e: MouseEvent) => {
    if (popoverEl && !popoverEl.contains(e.target as Node)) props.onClose()
  }
  const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') props.onClose() }

  onMount(() => {
    setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown, true)
      document.addEventListener('keydown', handleKeyDown, true)
    }, 0)
  })
  onCleanup(() => {
    document.removeEventListener('mousedown', handleMouseDown, true)
    document.removeEventListener('keydown', handleKeyDown, true)
  })

  return (
    <Portal>
      <div
        ref={el => { popoverEl = el }}
        class="rounded-lg shadow-xl overflow-hidden text-sm"
        style={{ ...style(), border: '1px solid var(--c-outline)', background: 'var(--c-surface)' }}
      >
        {props.children}
      </div>
    </Portal>
  )
}

// ── Menu section helpers ───────────────────────────────────────────────────────

function SectionLabel (props: { label: string }) {
  return <div class="px-3 pt-2.5 pb-1 text-xs font-medium" style={{ color: 'var(--c-text-muted)' }}>{props.label}</div>
}

function Divider () {
  return <div class="border-t" style={{ 'border-color': 'var(--c-outline)' }} />
}

type MenuBtnProps = {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  class?: string
  children: JSXElement
}

function MenuBtn (props: MenuBtnProps) {
  return (
    <button
      class={classNames(
        'w-full flex items-center gap-2 px-3 py-2 text-xs text-left rounded-sm transition-colors',
        props.disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer hover:bg-c-table-row-hover',
        props.class,
      )}
      style={{ color: props.active ? 'var(--md-primary)' : 'var(--c-text)' }}
      onClick={() => !props.disabled && props.onClick()}
    >
      {props.children}
    </button>
  )
}

// ── DataColHeaderMenu ─────────────────────────────────────────────────────────

type DataColMenuProps<T extends Record<string, unknown>> = {
  col: ColumnDef<T>
  table: TableState<T>
}

export function DataColHeaderMenu<T extends Record<string, unknown>> (props: DataColMenuProps<T>) {
  const t = props.table
  const key = () => props.col.key
  let btnEl: HTMLButtonElement | null = null
  const [open, setOpen] = createSignal(false)
  const [triggerRect, setTriggerRect] = createSignal<DOMRect | null>(null)

  const hasActive = () =>
    t.sort()?.key === key() ||
    !!(t.filters()[key()]?.trim()) ||
    (t.filterSelections()[key()]?.length ?? 0) > 0 ||
    t.pinnedKeys().includes(key()) ||
    t.groupKey() === key()

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (!open() && btnEl) setTriggerRect(btnEl.getBoundingClientRect())
    setOpen(v => !v)
  }

  return (
    <>
      <button
        ref={el => { btnEl = el }}
        class={classNames(
          'shrink-0 w-5 h-5 flex items-center justify-center rounded transition-all',
          hasActive()
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100',
        )}
        style={{ color: hasActive() ? 'var(--md-primary)' : 'var(--c-text-subtle)' }}
        onClick={handleClick}
        title="列选项"
      >
        <ChevronDownIcon />
      </button>
      <Show when={open() && triggerRect()}>
        <DataColMenuDropdown
          col={props.col}
          table={t}
          triggerRect={triggerRect()!}
          onClose={() => setOpen(false)}
        />
      </Show>
    </>
  )
}

// ── DataColMenuDropdown ───────────────────────────────────────────────────────

type DataColDropdownProps<T extends Record<string, unknown>> = {
  col: ColumnDef<T>
  table: TableState<T>
  triggerRect: DOMRect
  onClose: () => void
}

function DataColMenuDropdown<T extends Record<string, unknown>> (props: DataColDropdownProps<T>) {
  const t = props.table
  const key = props.col.key

  const currentDir = () => t.sort()?.key === key ? t.sort()!.dir : null
  const isFilterActive = () => !!(t.filters()[key]?.trim()) || (t.filterSelections()[key]?.length ?? 0) > 0
  const isPinned = () => t.pinnedKeys().includes(key)
  const isGrouped = () => t.groupKey() === key

  const colValues = () => {
    const vals = t.getColumnValues(key)
    return vals.length > MAX_COL_VALUES ? vals.slice(0, MAX_COL_VALUES) : vals
  }
  const hasMoreValues = () => t.getColumnValues(key).length > MAX_COL_VALUES

  return (
    <Popover triggerRect={props.triggerRect} onClose={props.onClose}>
      {/* ── Sort ── */}
      <SectionLabel label="排序" />
      <div class="flex gap-1 px-3 pb-2.5">
        {(['asc', 'desc'] as const).map(dir => (
          <button
            class={classNames(
              'flex-1 py-1.5 px-2 text-xs rounded transition-colors',
              currentDir() === dir ? 'text-white' : 'hover:bg-c-table-row-hover',
            )}
            style={currentDir() === dir ? { background: 'var(--md-primary)', color: 'white' } : { color: 'var(--c-text-muted)' }}
            onClick={() => t.setSortDir(key, currentDir() === dir ? null : dir)}
          >
            {dir === 'asc' ? '↑ 升序' : '↓ 降序'}
          </button>
        ))}
      </div>

      <Divider />

      {/* ── Filter ── */}
      <SectionLabel label={<span class="flex items-center gap-1.5">过滤 <Show when={isFilterActive()}><FilterActiveIcon /></Show></span>} />
      <div class="px-3 pb-2">
        <input
          type="text"
          value={t.filters()[key] ?? ''}
          onInput={e => t.setFilter(key, (e.currentTarget as HTMLInputElement).value)}
          placeholder="输入关键词..."
          class="w-full px-2 py-1.5 text-xs rounded outline-none transition-colors"
          style={{ border: '1px solid var(--c-outline)', background: 'var(--c-surface)', color: 'var(--c-text)' }}
          onClick={e => e.stopPropagation()}
        />
        <div class="mt-1.5 max-h-32 overflow-y-auto space-y-px">
          <For each={colValues()}>
            {val => {
              const isSelected = () => (t.filterSelections()[key] ?? []).includes(val)
              return (
                <label class="flex items-center gap-2 py-1 px-1 rounded cursor-pointer hover:bg-c-table-row-hover select-none">
                  <input
                    type="checkbox"
                    checked={isSelected()}
                    class="w-3.5 h-3.5 accent-md-primary shrink-0"
                    onChange={() => {
                      const cur = t.filterSelections()[key] ?? []
                      t.setFilterSelections(key, isSelected() ? cur.filter(v => v !== val) : [...cur, val])
                    }}
                  />
                  <span class="text-xs truncate" style={{ color: 'var(--c-text)' }}>{val || '(空)'}</span>
                </label>
              )
            }}
          </For>
          <Show when={hasMoreValues()}>
            <div class="px-1 py-1 text-xs" style={{ color: 'var(--c-text-subtle)' }}>仅显示前 60 个唯一值</div>
          </Show>
        </div>
        <Show when={isFilterActive()}>
          <button
            class="mt-1.5 w-full text-xs py-1 rounded transition-colors hover:bg-c-table-row-hover"
            style={{ color: 'var(--c-text-muted)' }}
            onClick={() => { t.setFilter(key, ''); t.setFilterSelections(key, []) }}
          >
            清除过滤
          </button>
        </Show>
      </div>

      <Divider />

      {/* ── Pin ── */}
      <div class="p-1">
        <Show when={!props.col.fixed}>
          <MenuBtn active={isPinned()} onClick={() => isPinned() ? t.unpinColumn(key) : t.pinColumn(key)}>
            <PinIcon active={isPinned()} />
            {isPinned() ? '取消固定' : '固定此列'}
          </MenuBtn>
        </Show>

        {/* ── Group ── */}
        <MenuBtn active={isGrouped()} onClick={() => t.setGroupKey(isGrouped() ? null : key)}>
          <GroupIcon active={isGrouped()} />
          {isGrouped() ? '取消分组' : '按此列分组'}
        </MenuBtn>
      </div>
    </Popover>
  )
}

// ── ActionColHeaderMenu ───────────────────────────────────────────────────────

type ActionMenuProps<T extends Record<string, unknown>> = {
  table: TableState<T>
}

export function ActionColHeaderMenu<T extends Record<string, unknown>> (props: ActionMenuProps<T>) {
  const t = props.table
  let btnEl: HTMLButtonElement | null = null
  const [open, setOpen] = createSignal(false)
  const [triggerRect, setTriggerRect] = createSignal<DOMRect | null>(null)

  const hasAnyActive = () =>
    !!t.sort() ||
    Object.values(t.filters()).some(v => v.trim()) ||
    Object.values(t.filterSelections()).some(v => v.length > 0) ||
    t.pinnedKeys().length > 0 ||
    !!t.groupKey() ||
    t.hiddenKeys().length > 0

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (!open() && btnEl) setTriggerRect(btnEl.getBoundingClientRect())
    setOpen(v => !v)
  }

  return (
    <>
      <button
        ref={el => { btnEl = el }}
        class={classNames(
          'shrink-0 w-5 h-5 flex items-center justify-center rounded transition-all',
          hasAnyActive()
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100',
        )}
        style={{ color: hasAnyActive() ? 'var(--md-primary)' : 'var(--c-text-subtle)' }}
        onClick={handleClick}
        title="表格选项"
      >
        <DotsVerticalIcon />
      </button>
      <Show when={open() && triggerRect()}>
        <ActionColMenuDropdown
          table={t}
          triggerRect={triggerRect()!}
          onClose={() => setOpen(false)}
        />
      </Show>
    </>
  )
}

// ── ActionColMenuDropdown ─────────────────────────────────────────────────────

type ActionDropdownProps<T extends Record<string, unknown>> = {
  table: TableState<T>
  triggerRect: DOMRect
  onClose: () => void
}

function ActionColMenuDropdown<T extends Record<string, unknown>> (props: ActionDropdownProps<T>) {
  const t = props.table

  // All non-action, non-statically-hidden columns are toggleable
  const toggleableCols = () => t.columns.filter(c => {
    if (c.isAction) return false
    const h = c.hidden
    return !(typeof h === 'function' ? h() : !!h)
  })

  const hasFilter = () =>
    Object.values(t.filters()).some(v => v.trim()) ||
    Object.values(t.filterSelections()).some(v => v.length > 0)

  return (
    <Popover triggerRect={props.triggerRect} onClose={props.onClose}>
      {/* ── Column visibility ── */}
      <SectionLabel label="显示列" />
      <div class="px-3 pb-2.5 max-h-44 overflow-y-auto space-y-px">
        <For each={toggleableCols()}>
          {col => {
            const isVisible = () => !t.hiddenKeys().includes(col.key)
            const title = typeof col.title === 'string' ? col.title : col.key
            return (
              <label class="flex items-center gap-2 py-1 px-1 rounded cursor-pointer hover:bg-c-table-row-hover select-none">
                <input
                  type="checkbox"
                  checked={isVisible()}
                  class="w-3.5 h-3.5 accent-md-primary shrink-0"
                  onChange={() => t.toggleColumnVisibility(col.key)}
                  onClick={e => e.stopPropagation()}
                />
                <span class="text-xs truncate" style={{ color: 'var(--c-text)' }}>{title}</span>
              </label>
            )
          }}
        </For>
      </div>

      <Divider />

      {/* ── Reset actions ── */}
      <div class="p-1">
        <MenuBtn onClick={() => t.resetColumnVisibility()} disabled={t.hiddenKeys().length === 0}>
          <ResetIcon />重置列显示
        </MenuBtn>
        <MenuBtn onClick={() => t.clearSort()} disabled={!t.sort()}>
          <ResetIcon />重置排序
        </MenuBtn>
        <MenuBtn onClick={() => t.clearFilters()} disabled={!hasFilter()}>
          <ResetIcon />重置过滤
        </MenuBtn>
        <MenuBtn onClick={() => t.clearAllPins()} disabled={t.pinnedKeys().length === 0}>
          <ResetIcon />取消所有固定列
        </MenuBtn>
        <MenuBtn onClick={() => t.setGroupKey(null)} disabled={!t.groupKey()}>
          <ResetIcon />取消分组
        </MenuBtn>
      </div>
    </Popover>
  )
}
