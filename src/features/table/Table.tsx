import classNames from 'classnames'
import { createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import type { JSX } from 'solid-js'
import { alignClass, computeColWidthsPx, EXPAND_COL_W, SELECTION_COL_W } from './Table.helpers'
import { ActionColHeaderMenu, DataColHeaderMenu } from './Table.menu'
import { Checkbox, FilterActiveIcon, Pagination, SortIcon } from './Table.ui'
import type { ColumnDef, ExpandConfig, GroupedRow, TableState } from './types'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export type TableProps<T extends object> = {
  table: TableState<T>
  /** Stick the header to the top of the scroll container (default: true) */
  stickyHeader?: boolean
  /** Show a loading overlay */
  loading?: () => boolean
  /** Extra class names on the outer wrapper */
  class?: string
  /** Placeholder shown when there are no rows — string or custom JSX */
  emptyText?: JSX.Element
  /**
   * Page size options shown in the per-page selector when pagination is enabled.
   * Defaults to [10, 20, 50, 100].
   */
  pageSizeOptions?: number[]
  /**
   * When provided, each row gets an expand toggle column on the far left.
   * Expand state and sub-data loading are owned by the parent — Table only
   * renders the chevron column and the full-width content panel.
   */
  expandable?: ExpandConfig<T>
}

export default function Table<T extends object> (props: TableProps<T>) {
  const t = props.table
  // Observe the inner scroll container — contentRect.width excludes the vertical
  // scrollbar, preventing it from triggering a spurious horizontal scrollbar.
  let scrollEl: HTMLDivElement | null = null
  const [containerW, setContainerW] = createSignal(0)

  onMount(() => {
    if (!scrollEl) return
    setContainerW(scrollEl.getBoundingClientRect().width)
    const ro = new ResizeObserver(entries => setContainerW(entries[0].contentRect.width))
    ro.observe(scrollEl)
    onCleanup(() => ro.disconnect())
  })

  const stickyHeader = () => props.stickyHeader !== false
  const isLoading = () => props.loading?.() ?? false
  const expW = () => (props.expandable ? EXPAND_COL_W : 0)
  const selW = () => (t.hasSelection ? SELECTION_COL_W : 0)

  const visibleColumns = createMemo(() =>
    t.columns.filter(c => {
      const h = c.hidden
      const staticHidden = typeof h === 'function' ? h() : !!h
      return !staticHidden && !t.hiddenKeys().includes(c.key)
    }),
  )

  // Order: static fixed-left → dynamic pins → scrollable → fixed-right / action
  const orderedColumns = createMemo(() => {
    const cols = visibleColumns()
    const pins = t.pinnedKeys()
    return [
      ...cols.filter(c => c.fixed === 'left'),
      ...cols.filter(c => !c.fixed && !c.isAction && pins.includes(c.key)),
      ...cols.filter(c => !c.fixed && !c.isAction && !pins.includes(c.key)),
      ...cols.filter(c => c.fixed === 'right' || c.isAction),
    ]
  })

  const colWidthsPx = createMemo(() =>
    computeColWidthsPx(orderedColumns(), containerW(), expW() + selW()),
  )

  // When columns overflow the container, tableWidthPx > containerW → triggers scroll
  const tableWidthPx = createMemo(() =>
    Math.max(containerW(), selW() + colWidthsPx().reduce((s, w) => s + w, 0)),
  )

  // Cumulative left offsets for all pinned columns (fixed-left + dynamic pins)
  const pinnedLeftOffsets = createMemo<Record<string, number>>(() => {
    const offsets: Record<string, number> = {}
    const cols = orderedColumns()
    const widths = colWidthsPx()
    const pins = t.pinnedKeys()
    let acc = expW() + selW()
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i]
      if (col.fixed !== 'left' && !pins.includes(col.key)) break
      offsets[col.key] = acc
      acc += widths[i]
    }
    return offsets
  })

  // Key of the rightmost pinned column — receives the separator shadow
  const lastPinnedKey = createMemo(() => {
    const pins = t.pinnedKeys()
    let last: string | null = null
    for (const col of orderedColumns()) {
      if (col.fixed === 'left' || pins.includes(col.key)) last = col.key
      else break
    }
    return last
  })

  // Key of the leftmost right-fixed column — receives the left separator shadow
  const firstRightKey = createMemo(() => {
    for (const col of orderedColumns()) {
      if (col.fixed === 'right' || col.isAction) return col.key
    }
    return null
  })

  // Cumulative right offsets for all right-fixed columns (rightmost = 0)
  const pinnedRightOffsets = createMemo<Record<string, number>>(() => {
    const offsets: Record<string, number> = {}
    const cols = orderedColumns()
    const widths = colWidthsPx()
    let acc = 0
    for (let i = cols.length - 1; i >= 0; i--) {
      const col = cols[i]
      if (col.fixed !== 'right' && !col.isAction) break
      offsets[col.key] = acc
      acc += widths[i]
    }
    return offsets
  })

  const colSpan = createMemo(() => orderedColumns().length + (t.hasSelection ? 1 : 0) + (props.expandable ? 1 : 0))

  // Title string of the current group-by column (for group header rows)
  const groupColTitle = createMemo(() => {
    const gk = t.groupKey()
    if (!gk) return ''
    const col = t.columns.find(c => c.key === gk)
    return col ? (typeof col.title === 'string' ? col.title : gk) : gk
  })

  function colStyle (col: ColumnDef<T>, idx: number): JSX.CSSProperties {
    const offsets = pinnedLeftOffsets()
    const pins = t.pinnedKeys()
    const isPinned = col.fixed === 'left' || pins.includes(col.key)
    const w = colWidthsPx()[idx]
    const s: JSX.CSSProperties = { width: `${w}px`, 'min-width': `${w}px` }
    if (isPinned) {
      s.position = 'sticky'
      s.left = `${offsets[col.key]}px`
      if (col.key === lastPinnedKey()) s['box-shadow'] = '2px 0 5px -2px rgba(0,0,0,0.15)'
    } else if (col.fixed === 'right' || col.isAction) {
      s.position = 'sticky'
      s.right = `${pinnedRightOffsets()[col.key] ?? 0}px`
      if (col.key === firstRightKey()) s['box-shadow'] = '-2px 0 5px -2px rgba(0,0,0,0.15)'
    }
    return s
  }

  function colZClass (col: ColumnDef<T>, isHeader: boolean) {
    const pins = t.pinnedKeys()
    const isPinnedLeft = col.fixed === 'left' || pins.includes(col.key)
    const isPinnedRight = col.fixed === 'right' || col.isAction
    if ((isPinnedLeft || isPinnedRight) && isHeader) return 'z-overlay'
    if (isPinnedLeft || isPinnedRight) return 'z-focus'
    return ''
  }

  const expStyle = (): JSX.CSSProperties => ({
    position: 'sticky', left: '0',
    width: `${EXPAND_COL_W}px`, 'min-width': `${EXPAND_COL_W}px`,
  })

  const selStyle = (): JSX.CSSProperties => ({
    position: 'sticky', left: `${expW()}px`,
    width: `${SELECTION_COL_W}px`, 'min-width': `${SELECTION_COL_W}px`,
    ...(!lastPinnedKey() ? { 'box-shadow': '2px 0 5px -2px rgba(0,0,0,0.15)' } : {}),
  })

  return (
    <div class={classNames('relative flex flex-col max-h-full overflow-hidden rounded-lg border border-c-outline bg-c-surface', props.class)}>
      <div ref={el => { scrollEl = el }} class="overflow-auto flex-1 min-h-0">
        <div style={{ width: containerW() > 0 ? `${tableWidthPx()}px` : '100%' }}>
          <table class="w-full border-collapse text-sm text-c-text" style={{ 'table-layout': 'fixed' }}>

          <thead class={classNames(isLoading() && 'pointer-events-none')}>
            <tr class={classNames('bg-c-table-header-bg text-c-table-header-text', stickyHeader() && 'sticky top-0 z-sticky')}>
              <Show when={props.expandable}>
                <th class="px-2 py-3 w-10 bg-c-table-header-bg z-overlay" style={expStyle()} />
              </Show>
              <Show when={t.hasSelection}>
                <th class="px-3 py-3 bg-c-table-header-bg z-overlay" style={selStyle()}>
                  <Checkbox checked={t.isAllSelected()} indeterminate={t.isIndeterminate()} onChange={t.toggleSelectAll} />
                </th>
              </Show>
              <For each={orderedColumns()}>
                {(col, i) => {
                  const hasColFilter = () =>
                    !!(t.filters()[col.key]?.trim()) ||
                    (t.filterSelections()[col.key]?.length ?? 0) > 0
                  return (
                    <th
                      class={classNames(
                        'px-4 py-3 font-semibold text-xs whitespace-nowrap bg-c-table-header-bg group',
                        alignClass(col.align), colZClass(col, true),
                      )}
                      style={{ ...colStyle(col, i()), color: 'var(--c-text-muted)' }}
                    >
                      <div class="flex items-center justify-between gap-1 min-w-0">
                        {/* Title + active-state indicators */}
                        <span class="flex items-center gap-1 min-w-0 flex-1 truncate">
                          {col.title}
                          <Show when={t.sort()?.key === col.key}>
                            <SortIcon dir={t.sort()!.dir} />
                          </Show>
                          <Show when={hasColFilter()}>
                            <FilterActiveIcon />
                          </Show>
                        </span>
                        {/* Per-column menu or action-column settings menu */}
                        <Show when={!col.isAction} fallback={
                          <ActionColHeaderMenu table={t} />
                        }>
                          <DataColHeaderMenu col={col} table={t} />
                        </Show>
                      </div>
                    </th>
                  )
                }}
              </For>
            </tr>
          </thead>

          <tbody>
            <Show when={isLoading()}>
              <tr>
                <td colspan={colSpan()} class="px-5 py-14 text-center">
                  <div class="flex justify-center">
                    <div class="w-7 h-7 border-2 rounded-full animate-spin" style={{ 'border-color': 'var(--md-primary)', 'border-top-color': 'transparent' }} />
                  </div>
                </td>
              </tr>
            </Show>
            <Show when={!isLoading()}>
              <Show when={t.displayData().length > 0} fallback={
                <tr><td colspan={colSpan()} class="px-5 py-10 text-center text-c-text-subtle">{props.emptyText ?? '暂无数据'}</td></tr>
              }>
                <For each={t.groupedRows()}>
                  {(item: GroupedRow<T>) => {
                    if (item.type === 'group') {
                      return (
                        <tr class="border-t border-c-table-border" style={{ background: 'var(--c-table-header-bg)' }}>
                          <td colspan={colSpan()} class="px-5 py-2 text-xs font-semibold" style={{ color: 'var(--c-text-muted)' }}>
                            <span style={{ color: 'var(--c-text)' }}>{groupColTitle()}</span>
                            <span class="mx-1.5" style={{ color: 'var(--c-text-subtle)' }}>/</span>
                            <span>{item.value || '(空)'}</span>
                          </td>
                        </tr>
                      )
                    }
                    const { row, index } = item
                    const key = t.rowKey(row)
                    const isSelected = () => t.selectedKeys().includes(key)
                    const isExpanded = () => props.expandable?.isExpanded(row) ?? false
                    const canExpand = () => props.expandable?.isExpandable ? props.expandable.isExpandable(row) : !!props.expandable
                    return (
                      <>
                      <tr
                        class={classNames(
                          'border-t border-c-table-border transition-colors group',
                          isSelected() ? 'bg-c-table-row-selected-bg' : 'hover:bg-c-table-row-hover',
                          props.expandable && canExpand() && 'cursor-pointer',
                        )}
                        onClick={props.expandable && canExpand() ? () => props.expandable!.onToggle(row) : undefined}
                      >
                        <Show when={props.expandable}>
                          <td
                            class={classNames('p-0 z-focus transition-colors', isSelected() ? 'bg-c-table-row-selected-bg' : 'bg-c-surface group-hover:bg-c-table-row-hover')}
                            style={expStyle()}
                          >
                            <Show when={canExpand()}>
                              <div class="w-full px-2 py-3.5 flex items-center justify-center">
                                <span
                                  class="inline-flex transition-transform duration-200"
                                  style={{ transform: isExpanded() ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="var(--c-text-muted)"><path d="M8.59 16.58L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.42z"/></svg>
                                </span>
                              </div>
                            </Show>
                          </td>
                        </Show>
                        <Show when={t.hasSelection}>
                          <td class={classNames('px-3 py-3.5 z-focus', isSelected() ? 'bg-c-table-row-selected-bg' : 'bg-c-surface')} style={selStyle()}>
                            <Checkbox checked={isSelected()} onChange={() => t.toggleSelect(key)} />
                          </td>
                        </Show>
                        <For each={orderedColumns()}>
                          {(col, i) => {
                            const isCellActive = () =>
                              t.activeCell()?.rowKey === key && t.activeCell()?.colKey === col.key
                            const handleCellClick = () => {
                              const cur = t.activeCell()
                              t.setActiveCell(
                                cur?.rowKey === key && cur?.colKey === col.key
                                  ? null
                                  : { rowKey: key, colKey: col.key },
                              )
                            }
                            return (
                              <td
                                class={classNames(
                                  'px-5 py-3.5 transition-colors',
                                  !props.expandable && 'cursor-default',
                                  alignClass(col.align), colZClass(col, false),
                                  (col.fixed === 'left' || col.fixed === 'right' || col.isAction || t.pinnedKeys().includes(col.key))
                                    && (isSelected() ? 'bg-c-table-row-selected-bg' : 'bg-c-surface'),
                                  !props.expandable && isCellActive() && 'ring-2 ring-inset ring-md-primary',
                                )}
                                style={colStyle(col, i())}
                                onClick={props.expandable ? undefined : handleCellClick}
                              >
                                {col.render ? col.render((row as Record<string, unknown>)[col.key] as T[keyof T & string], row, index) : String((row as Record<string, unknown>)[col.key] ?? '')}
                              </td>
                            )
                          }}
                        </For>
                      </tr>                      <Show when={props.expandable && isExpanded()}>
                        <tr class="border-t border-c-table-border">
                          <td colspan={colSpan()} class="p-0">
                            <div style={{ background: 'var(--c-bg)', 'border-left': '3px solid var(--md-primary)' }}>
                              {props.expandable!.renderContent(row)}
                            </div>
                          </td>
                        </tr>
                      </Show>
                      </>
                    )
                  }}
                </For>
              </Show>
            </Show>
          </tbody>
          </table>
        </div>
      </div>

      <Show when={t.hasPagination && t.total() > 0}>
        <div class={classNames('shrink-0', isLoading() && 'pointer-events-none')}>
          <Pagination page={t.page} pageSize={t.pageSize} total={t.total} onPageChange={t.setPage} onPageSizeChange={t.setPageSize} pageSizeOptions={props.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS} />
        </div>
      </Show>
    </div>
  )
}
