import { batch, createMemo, createSignal } from 'solid-js'
import type { FilterSelections, FilterState, GroupedRow, SortDir, SortState, TableConfig, TableState } from './types'

export function createTable<T extends Record<string, unknown>> (config: TableConfig<T>): TableState<T> {
  const {
    columns,
    data,
    rowKey = (row: T) => String((row as Record<string, unknown>).id ?? JSON.stringify(row)),
    pagination: clientPagination = false,
    serverPagination = false,
    externalTotal,
    selection: hasSelection = false,
    defaultPageSize = 10,
  } = config

  const hasPagination = clientPagination || serverPagination

  /* ── Signals ── */
  const [sort, _setSort] = createSignal<SortState>(null)
  const [filters, setFilters] = createSignal<FilterState>({})
  const [filterSelections, _setFilterSelections] = createSignal<FilterSelections>({})
  const [page, _setPage] = createSignal(1)
  const [pageSize, _setPageSize] = createSignal(defaultPageSize)
  const [selectedKeys, setSelectedKeys] = createSignal<string[]>([])
  const [pinnedKeys, setPinnedKeys] = createSignal<string[]>([])
  const [groupKey, _setGroupKey] = createSignal<string | null>(null)
  const [hiddenKeys, _setHiddenKeys] = createSignal<string[]>([])
  const [activeCell, _setActiveCell] = createSignal<{ rowKey: string; colKey: string } | null>(null)

  /* ── Derived: filtered + sorted rows ── */
  const processedData = createMemo(() => {
    let rows = [...data()]

    // Text filters
    const active = filters()
    for (const [key, val] of Object.entries(active)) {
      if (!val.trim()) continue
      const lower = val.toLowerCase()
      rows = rows.filter(row => String(row[key] ?? '').toLowerCase().includes(lower))
    }

    // Multi-select filters (AND between columns)
    const selections = filterSelections()
    for (const [key, vals] of Object.entries(selections)) {
      if (!vals.length) continue
      rows = rows.filter(row => vals.includes(String(row[key] ?? '')))
    }

    // Sort
    const s = sort()
    if (s) {
      rows.sort((a, b) => {
        const av = a[s.key] as string | number | null | undefined
        const bv = b[s.key] as string | number | null | undefined
        if (av === bv) return 0
        if (av === null || av === undefined) return 1
        if (bv === null || bv === undefined) return -1
        const cmp = av < bv ? -1 : 1
        return s.dir === 'asc' ? cmp : -cmp
      })
    }

    return rows
  })

  const total = createMemo(() => externalTotal?.() ?? processedData().length)

  /* ── Derived: paginated view ── */
  const displayData = createMemo(() => {
    if (serverPagination) return processedData()
    if (!clientPagination) return processedData()
    const start = (page() - 1) * pageSize()
    return processedData().slice(start, start + pageSize())
  })

  /* ── Derived: grouped rows ── */
  const groupedRows = createMemo((): GroupedRow<T>[] => {
    const gk = groupKey()
    const rows = displayData()
    if (!gk) return rows.map((row, index) => ({ type: 'row', row, index }))

    const groupOrder: string[] = []
    const groupMap = new Map<string, T[]>()
    for (const row of rows) {
      const val = String(row[gk] ?? '')
      if (!groupMap.has(val)) { groupOrder.push(val); groupMap.set(val, []) }
      groupMap.get(val)!.push(row)
    }

    const result: GroupedRow<T>[] = []
    let idx = 0
    for (const val of groupOrder) {
      result.push({ type: 'group', value: val })
      for (const row of groupMap.get(val)!) result.push({ type: 'row', row, index: idx++ })
    }
    return result
  })

  /* ── Derived: current-page keys ── */
  const currentPageKeys = createMemo(() => displayData().map(row => rowKey(row)))

  const isAllSelected = createMemo(() => {
    const keys = currentPageKeys()
    return keys.length > 0 && keys.every(k => selectedKeys().includes(k))
  })

  const isIndeterminate = createMemo(() => {
    const keys = currentPageKeys()
    const sel = selectedKeys()
    return !isAllSelected() && keys.some(k => sel.includes(k))
  })

  /* ── Actions ── */
  function setSort (key: string) {
    batch(() => {
      _setSort(prev => {
        if (!prev || prev.key !== key) return { key, dir: 'asc' }
        if (prev.dir === 'asc') return { key, dir: 'desc' }
        return null
      })
      _setPage(1)
    })
  }

  function setSortDir (key: string, dir: SortDir | null) {
    batch(() => { _setSort(dir ? { key, dir } : null); _setPage(1) })
  }

  function clearSort () {
    batch(() => { _setSort(null); _setPage(1) })
  }

  function setFilter (key: string, value: string) {
    batch(() => { setFilters(prev => ({ ...prev, [key]: value })); _setPage(1) })
  }

  function setFilterSelections (key: string, values: string[]) {
    batch(() => { _setFilterSelections(prev => ({ ...prev, [key]: values })); _setPage(1) })
  }

  function clearFilters () {
    batch(() => { setFilters({}); _setFilterSelections({}); _setPage(1) })
  }

  function setPage (p: number) {
    _setPage(Math.max(1, Math.min(p, Math.ceil(total() / pageSize()))))
  }

  function setPageSize (size: number) {
    batch(() => { _setPageSize(size); _setPage(1) })
  }

  function toggleSelect (key: string) {
    setSelectedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  function toggleSelectAll () {
    const keys = currentPageKeys()
    if (isAllSelected()) {
      setSelectedKeys(prev => prev.filter(k => !keys.includes(k)))
    } else {
      setSelectedKeys(prev => [...new Set([...prev, ...keys])])
    }
  }

  function clearSelection () { setSelectedKeys([]) }

  function pinColumn (key: string) {
    setPinnedKeys(prev => prev.includes(key) ? prev : [...prev, key])
  }

  function unpinColumn (key: string) {
    setPinnedKeys(prev => prev.filter(k => k !== key))
  }

  function clearAllPins () { setPinnedKeys([]) }

  function setGroupKey (key: string | null) { _setGroupKey(key) }

  function toggleColumnVisibility (key: string) {
    _setHiddenKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  function resetColumnVisibility () { _setHiddenKeys([]) }

  function setActiveCell (cell: { rowKey: string; colKey: string } | null) { _setActiveCell(cell) }

  function getColumnValues (key: string): string[] {
    const seen = new Set<string>()
    for (const row of data()) seen.add(String(row[key] ?? ''))
    return [...seen].sort()
  }

  return {
    columns,
    rowKey,
    hasPagination,
    hasSelection,
    sort,
    filters,
    filterSelections,
    page,
    pageSize,
    total,
    selectedKeys,
    displayData,
    groupedRows,
    isAllSelected,
    isIndeterminate,
    pinnedKeys,
    groupKey,
    hiddenKeys,
    activeCell,
    setSort,
    setSortDir,
    clearSort,
    setFilter,
    setFilterSelections,
    clearFilters,
    setPage,
    setPageSize,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    pinColumn,
    unpinColumn,
    clearAllPins,
    setGroupKey,
    toggleColumnVisibility,
    resetColumnVisibility,
    setActiveCell,
    getColumnValues,
  }
}

