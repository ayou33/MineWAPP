import { For, JSX, Show, splitProps } from 'solid-js'
import Icon from '@/components/Icon'

export type TabItem = {
  id: string
  label: string
  icon?: string
  iconSet?: string
  /** 徽标数字（如未读数），> 0 时显示红点 */
  badge?: number
}

export type TabPageProps = {
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
  /** 页面头部右侧操作区——新增、导出等主操作按钮 */
  actions?: JSX.Element
  /** Tab 列表 */
  tabs: TabItem[]
  /** 当前激活的 tab id */
  activeTab: string
  /** 切换 tab 回调 */
  onTabChange: (id: string) => void
  /** 数据展示区域 */
  children: JSX.Element
}

/**
 * 带 Tab 导航的系统菜单页面布局容器。
 *
 * 结构：
 *   ┌─ 页面头部（标题 + 描述 ｜ 右侧 actions）──┐
 *   ├─ Tab 条（tab strip）──────────────────────┤
 *   └─ 数据展示区（children）──────────────────┘
 *
 * @example
 * const [activeTab, setActiveTab] = createSignal('all')
 *
 * <TabPage
 *   title="主合同管理"
 *   desc="录入、修改、查询主合同"
 *   icon="file-document"
 *   color="#2E60F9"
 *   tabs={[
 *     { id: 'all',     label: '全部' },
 *     { id: 'active',  label: '执行中', badge: 12 },
 *     { id: 'expired', label: '已到期' },
 *   ]}
 *   activeTab={activeTab()}
 *   onTabChange={setActiveTab}
 *   actions={<Button>新增合同</Button>}
 * >
 *   <ContractTable filter={activeTab()} />
 * </TabPage>
 */
export default function TabPage (props: TabPageProps) {
  const [local] = splitProps(props, [
    'title', 'desc', 'icon', 'iconSet', 'color', 'actions', 'tabs', 'activeTab', 'onTabChange', 'children',
  ])

  return (
    <div class="flex flex-col gap-4 h-full">
      {/* ── Tab 条 ───────────────────────────── */}
      <div
        class="card rounded-xl"
        style={{
          'scrollbar-width': 'none',
        }}
      >
        <div class="flex items-stretch px-2" style={{ height: '44px' }}>
          <For each={local.tabs}>
            {(tab) => {
              const active = () => local.activeTab === tab.id
              return (
                <button
                  class="relative flex items-center gap-1.5 px-4 text-sm font-medium whitespace-nowrap border-0 bg-transparent cursor-pointer transition-colors duration-150 shrink-0"
                  style={{ color: active() ? 'var(--c-tab-text-active)' : 'var(--c-tab-text-inactive)' }}
                  onClick={() => local.onTabChange(tab.id)}
                >
                  {/* 图标（可选） */}
                  <Show when={tab.icon}>
                    <Icon name={tab.icon!} set={tab.iconSet ?? 'mdi'} size={14} />
                  </Show>

                  {/* 标签文字 */}
                  {tab.label}

                  {/* 徽标 */}
                  <Show when={(tab.badge ?? 0) > 0}>
                    <span
                      class="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none"
                      style={{
                        background: active() ? 'var(--md-primary)' : 'var(--md-surface-variant)',
                        color:      active() ? 'var(--md-on-primary)' : 'var(--c-text-muted)',
                      }}
                    >
                      {(tab.badge ?? 0) > 99 ? '99+' : tab.badge}
                    </span>
                  </Show>

                  {/* 活动指示条 */}
                  <Show when={active()}>
                    <span
                      class="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                      style={{ background: 'var(--c-tab-indicator)' }}
                    />
                  </Show>
                </button>
              )
            }}
          </For>
        </div>
      </div>

      {/* ── 数据展示区域 ─────────────────────── */}
      <div class="relative flex-1 min-h-40">
        {local.children}
      </div>

    </div>
  )
}
