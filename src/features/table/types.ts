import { Accessor, JSXElement } from 'solid-js'

export type SortDir = 'asc' | 'desc'

export type SortState = {
  key: string
  dir: SortDir
} | null

export type FilterState = Record<string, string>

export type ColumnAlign = 'left' | 'center' | 'right'

export type ColumnFixed = 'left' | 'right'

export type ColumnDef<T extends Record<string, unknown>> = {
  /** Unique key, also used to access row data via `row[key]` */
  key: string
  title: string | JSXElement
  width?: number | string
  /** Pin column to the left or right edge while the table scrolls horizontally */
  fixed?: ColumnFixed
  /** Show sort toggle on the header cell */
  sortable?: boolean
  /** Show a text filter input below the header */
  filterable?: boolean
  /** Custom cell renderer */
  render?: (value: T[keyof T & string], row: T, index: number) => JSXElement
  align?: ColumnAlign
}

export type TableConfig<T extends Record<string, unknown>> = {
  columns: ColumnDef<T>[]
  data: Accessor<T[]>
  /** Derive a unique string key from a row (defaults to `row.id`) */
  rowKey?: (row: T) => string
  /** Enable built-in client-side pagination */
  pagination?: boolean
  /** Enable row selection checkboxes */
  selection?: boolean
  /** Rows per page when pagination is enabled (default: 10) */
  defaultPageSize?: number
}

export type TableState<T extends Record<string, unknown>> = {
  /* ── Static config ── */
  columns: ColumnDef<T>[]
  rowKey: (row: T) => string
  hasPagination: boolean
  hasSelection: boolean

  /* ── Reactive signals ── */
  sort: Accessor<SortState>
  filters: Accessor<FilterState>
  page: Accessor<number>
  pageSize: Accessor<number>
  /** Total count of rows after filtering (before pagination) */
  total: Accessor<number>
  selectedKeys: Accessor<string[]>
  /** Rows currently visible (after filter + sort + pagination) */
  displayData: Accessor<T[]>

  /* ── Selection helpers ── */
  isAllSelected: Accessor<boolean>
  isIndeterminate: Accessor<boolean>

  /* ── Actions ── */
  /** Toggle sort for a column: none → asc → desc → none */
  setSort: (key: string) => void
  setFilter: (key: string, value: string) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  toggleSelect: (key: string) => void
  toggleSelectAll: () => void
  clearSelection: () => void
}
