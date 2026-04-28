import { Accessor, JSXElement } from 'solid-js'

export type SortDir = 'asc' | 'desc'

export type SortState = {
  key: string
  dir: SortDir
} | null

export type FilterState = Record<string, string>

/** Per-column multi-select filter: the row value must be one of the chosen values */
export type FilterSelections = Record<string, string[]>

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
  /**
   * When `true` (or an accessor returning `true`) the column is completely
   * excluded from the rendered table — both the header cell and every body
   * cell are omitted.  Useful for permission-gated columns such as an
   * "操作" column that should disappear when the user has no actions.
   */
  hidden?: boolean | (() => boolean)
  /**
   * Mark this column as the "actions" column (操作栏).
   * Action columns receive a table-wide settings menu in the header instead
   * of the per-column sort / filter / group / pin menu.
   */
  isAction?: boolean
}

/** A row in the grouped display — either a group-label row or a data row */
export type GroupedRow<T> =
  | { type: 'group'; value: string }
  | { type: 'row'; row: T; index: number }

export type TableConfig<T extends Record<string, unknown>> = {
  columns: ColumnDef<T>[]
  data: Accessor<T[]>
  /** Derive a unique string key from a row (defaults to `row.id`) */
  rowKey?: (row: T) => string
  /** Enable built-in client-side pagination */
  pagination?: boolean
  /**
   * Enable server-side pagination mode. When true, `data` is expected to
   * already contain only the current page's rows (no client-side slicing).
   * Requires `externalTotal` to drive the pagination control correctly.
   * Implies `pagination: true` for rendering purposes.
   */
  serverPagination?: boolean
  /**
   * Override the row count used by the pagination control.
   * Required when `serverPagination` is true; ignored otherwise.
   */
  externalTotal?: Accessor<number>
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
  /** Multi-select filter values per column key (AND between columns) */
  filterSelections: Accessor<FilterSelections>
  page: Accessor<number>
  pageSize: Accessor<number>
  /** Total count of rows after filtering (before pagination) */
  total: Accessor<number>
  selectedKeys: Accessor<string[]>
  /** Rows currently visible (after filter + sort + pagination) */
  displayData: Accessor<T[]>
  /** Display rows with optional group-header rows interspersed */
  groupedRows: Accessor<GroupedRow<T>[]>

  /* ── Selection helpers ── */
  isAllSelected: Accessor<boolean>
  isIndeterminate: Accessor<boolean>

  /* ── Pin state ── */
  /** Keys of dynamically pinned columns (added at runtime via pinColumn) */
  pinnedKeys: Accessor<string[]>

  /* ── Group state ── */
  /** Key of the column currently used for row-grouping, or null */
  groupKey: Accessor<string | null>

  /* ── Runtime column visibility ── */
  /** Keys of columns the user has hidden at runtime */
  hiddenKeys: Accessor<string[]>

  /* ── Active cell ── */
  activeCell: Accessor<{ rowKey: string; colKey: string } | null>

  /* ── Actions ── */
  /** Toggle sort for a column: none → asc → desc → none */
  setSort: (key: string) => void
  /** Directly set sort direction, or null to clear */
  setSortDir: (key: string, dir: SortDir | null) => void
  /** Clear the active sort */
  clearSort: () => void
  setFilter: (key: string, value: string) => void
  setFilterSelections: (key: string, values: string[]) => void
  /** Clear all text filters and multi-select filters */
  clearFilters: () => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  toggleSelect: (key: string) => void
  toggleSelectAll: () => void
  clearSelection: () => void
  /** Dynamically pin a column by key (no-op if already pinned or statically fixed) */
  pinColumn: (key: string) => void
  /** Unpin a dynamically pinned column */
  unpinColumn: (key: string) => void
  /** Unpin all dynamically pinned columns */
  clearAllPins: () => void
  /** Set or clear the grouping column */
  setGroupKey: (key: string | null) => void
  /** Toggle a column's runtime visibility */
  toggleColumnVisibility: (key: string) => void
  /** Restore all runtime-hidden columns */
  resetColumnVisibility: () => void
  /** Set (or clear) the active cell for click-activation styling */
  setActiveCell: (cell: { rowKey: string; colKey: string } | null) => void
  /** Return sorted unique string values for a column from the raw data */
  getColumnValues: (key: string) => string[]
}

