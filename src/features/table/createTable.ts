import { batch, createMemo, createSignal } from 'solid-js'
import type { FilterState, SortState, TableConfig, TableState } from './types'

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
  const [page, _setPage] = createSignal(1)
  const [pageSize, _setPageSize] = createSignal(defaultPageSize)
  const [selectedKeys, setSelectedKeys] = createSignal<string[]>([])
  const [pinnedKeys, setPinnedKeys] = createSignal<string[]>([])

  /* ── Derived: filtered + sorted rows ── */
  const processedData = createMemo(() => {
    let rows = [...data()]

    // Apply text filters
    const active = filters()
    for (const [key, val] of Object.entries(active)) {
      if (!val.trim()) continue
      const lower = val.toLowerCase()
      rows = rows.filter(row => String(row[key] ?? '').toLowerCase().includes(lower))
    }

    // Apply sort
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
    // Server-side mode: data is already the current page — never slice
    if (serverPagination) return processedData()
    if (!clientPagination) return processedData()
    const start = (page() - 1) * pageSize()
    return processedData().slice(start, start + pageSize())
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

  function setFilter (key: string, value: string) {
    batch(() => {
      setFilters(prev => ({ ...prev, [key]: value }))
      _setPage(1)
    })
  }

  function setPage (p: number) {
    _setPage(Math.max(1, Math.min(p, Math.ceil(total() / pageSize()))))
  }

  function setPageSize (size: number) {
    batch(() => {
      _setPageSize(size)
      _setPage(1)
    })
  }

  function toggleSelect (key: string) {
    setSelectedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    )
  }

  function toggleSelectAll () {
    const keys = currentPageKeys()
    if (isAllSelected()) {
      setSelectedKeys(prev => prev.filter(k => !keys.includes(k)))
    } else {
      setSelectedKeys(prev => [...new Set([...prev, ...keys])])
    }
  }

  function clearSelection () {
    setSelectedKeys([])
  }

  function pinColumn (key: string) {
    setPinnedKeys(prev => prev.includes(key) ? prev : [...prev, key])
  }

  function unpinColumn (key: string) {
    setPinnedKeys(prev => prev.filter(k => k !== key))
  }

  return {
    columns,
    rowKey,
    hasPagination,
    hasSelection,
    sort,
    filters,
    page,
    pageSize,
    total,
    selectedKeys,
    displayData,
    isAllSelected,
    isIndeterminate,
    pinnedKeys,
    setSort,
    setFilter,
    setPage,
    setPageSize,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    pinColumn,
    unpinColumn,
  }
}

