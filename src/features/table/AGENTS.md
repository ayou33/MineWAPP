# src/features/table — Data Table

Client/server-side table with sort, filter (text + multi-select), selection, grouping, pinning, column visibility, resize, pagination, and expandable rows.

## Architecture
| File | Role |
|---|---|
| `createTable.ts` | **State engine** — `createTable(config): TableState<T>`; signals + derived memos (filter/sort/page/group/selection/pins) |
| `Table.tsx` | **Renderer** — header/body, sticky header, resize, pin offsets, expand rows, empty/loading states |
| `Table.menu.tsx` | Header menus: `DataColHeaderMenu` (per-column), `ActionColHeaderMenu` (table settings) |
| `Table.ui.tsx` | `Pagination`, `Checkbox`, `SortIcon`, `PinIcon`, `FilterActiveIcon` |
| `Table.helpers.ts` | Width math: `parseWidthToPx`, `computeColWidthsPx`, `alignClass`, constants |
| `types.ts` | `ColumnDef`, `ExpandConfig`, `TableConfig`, `TableState`, `SortState`, `FilterState`, … |
| `index.ts` | Barrel |

## Key types
```ts
type ColumnDef<T> = {
  key: string
  title: string | JSXElement
  width?: number | string
  fixed?: 'left' | 'right'
  sortable?: boolean
  filterable?: boolean
  render?: (value, row, index) => JSXElement
  hidden?: boolean | (() => boolean)   // permission-gated columns
  isAction?: boolean                   // action column → table settings menu
}
type ExpandConfig<T> = {
  onToggle: (row) => void
  isExpanded: (row) => boolean
  renderContent: (row) => JSXElement
  isExpandable?: (row) => boolean
}
```

## Conventions & pitfalls
- State lives in `createTable`; `Table` is a controlled renderer — expand state and sub-data loading are owned by the parent.
- Server pagination: `serverPagination: true` + `externalTotal`; data is the current page (never sliced).
- `rowKey` defaults to `row.id`; provide a stable one for selection/expand.
- Widths: string (`px/rem/em/%/vw`) are exact; numbers are flex weights of remaining space.
- **i18n**: table UI strings are hardcoded Chinese — route through `t()` when touched.
