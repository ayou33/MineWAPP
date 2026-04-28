import { JSX, Show, splitProps } from 'solid-js'
import Icon from '@/components/Icon'

export type PageProps = {
  /** 页面标题 */
  title: string
  /** 页面描述 */
  desc?: string
  /** 标题左侧图标名称 */
  icon?: string
  /** 图标集（默认 mdi） */
  iconSet?: string
  /** 图标 & 装饰色（默认 --md-primary） */
  color?: string
  /**
   * 顶部工具栏区域——搜索框、筛选器等
   * 不传则不渲染工具栏行
   */
  toolbar?: JSX.Element
  /**
   * 页面头部右侧操作区——新增、导出等主操作按钮
   */
  actions?: JSX.Element
  /** 数据展示区域（表格、卡片列表等） */
  children: JSX.Element
}

/**
 * 系统菜单页面通用布局容器。
 *
 * 结构：
 *   ┌─ 页面头部（标题 + 描述 ｜ 右侧 actions）──┐
 *   ├─ 工具栏（toolbar，可选）──────────────────┤
 *   └─ 数据展示区（children）──────────────────┘
 *
 * @example
 * <Page
 *   title="主合同管理"
 *   desc="录入、修改、查询主合同"
 *   icon="file-document"
 *   color="#2E60F9"
 *   toolbar={<SearchBar />}
 *   actions={<Button>新增合同</Button>}
 * >
 *   <ContractTable />
 * </Page>
 */
export default function Page (props: PageProps) {
  const [local] = splitProps(props, [
    'title', 'desc', 'icon', 'iconSet', 'color', 'toolbar', 'actions', 'children',
  ])

  const iconColor = () => local.color ?? 'var(--md-primary)'
  const iconBg = () => local.color ? `${local.color}18` : 'var(--md-primary-container)'

  return (
    <div class="flex flex-col gap-4 h-full">

      {/* ── 页面头部 ─────────────────────────── */}
      <div
        class="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border"
        style={{
          background:     'var(--c-surface)',
          'border-color': 'var(--c-outline)',
          'box-shadow':   'var(--md-shadow-sm)',
        }}
      >
        {/* 左：图标 + 标题 + 描述 */}
        <div class="flex items-center gap-3 min-w-0">
          <Show when={local.icon}>
            <div
              class="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
              style={{ background: iconBg() }}
            >
              <Icon name={local.icon!} set={local.iconSet ?? 'mdi'} size={20} color={iconColor()} />
            </div>
          </Show>

          <div class="min-w-0">
            <h1 class="text-base font-semibold text-c-text leading-tight truncate">
              {local.title}
            </h1>
            <Show when={local.desc}>
              <p class="text-xs text-c-text-subtle mt-0.5 truncate">{local.desc}</p>
            </Show>
          </div>
        </div>

        {/* 右：操作按钮 */}
        <Show when={local.actions}>
          <div class="flex items-center gap-2 shrink-0">
            {local.actions}
          </div>
        </Show>
      </div>

      {/* ── 工具栏（搜索 & 筛选）──可选──── */}
      <Show when={local.toolbar}>
        <div class="card flex flex-wrap items-center gap-3 px-4 py-3">
          {local.toolbar}
        </div>
      </Show>

      {/* ── 数据展示区域 ─────────────────────── */}
      <div class="flex-1 overflow-hidden">
        {local.children}
      </div>

    </div>
  )
}
