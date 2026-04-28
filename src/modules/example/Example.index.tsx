import { createTable, Table } from '@/features/table'
import { createForm, required, minLength, maxLength, min, max, email } from '@/features/form'
import Button from '@/components/Button'
import usePageContext from '@/hooks/usePageContext'
import { TipType } from '@/config'
import { createEffect, createSignal, For, JSXElement, ParentProps, Show } from 'solid-js'

// --- Constants --------------------------------------------------------------

const USERNAME_MAX = 30
const AGE_MAX = 120
const BIO_MAX = 200

// --- Demo data --------------------------------------------------------------

type User = {
  id: number
  name: string
  email: string
  role: string
  age: number
  status: 'active' | 'inactive'
  score: number
}

const SEED_DATA: User[] = [
  { id: 1, name: 'Alice Chen', email: 'alice@example.com', role: 'Admin', age: 28, status: 'active', score: 92 },
  { id: 2, name: 'Bob Wang', email: 'bob@example.com', role: 'Editor', age: 34, status: 'active', score: 78 },
  { id: 3, name: 'Carol Li', email: 'carol@example.com', role: 'Viewer', age: 22, status: 'inactive', score: 65 },
  { id: 4, name: 'David Zhang', email: 'david@example.com', role: 'Editor', age: 41, status: 'active', score: 88 },
  { id: 5, name: 'Eve Zhao', email: 'eve@example.com', role: 'Admin', age: 29, status: 'active', score: 95 },
  { id: 6, name: 'Frank Liu', email: 'frank@example.com', role: 'Viewer', age: 55, status: 'inactive', score: 71 },
  { id: 7, name: 'Grace Wu', email: 'grace@example.com', role: 'Editor', age: 37, status: 'active', score: 83 },
  { id: 8, name: 'Henry Xu', email: 'henry@example.com', role: 'Viewer', age: 26, status: 'inactive', score: 60 },
  { id: 9, name: 'Iris Sun', email: 'iris@example.com', role: 'Admin', age: 31, status: 'active', score: 91 },
  { id: 10, name: 'Jack Hu', email: 'jack@example.com', role: 'Editor', age: 48, status: 'active', score: 76 },
  { id: 11, name: 'Kelly Yang', email: 'kelly@example.com', role: 'Viewer', age: 24, status: 'inactive', score: 58 },
  { id: 12, name: 'Leo Guo', email: 'leo@example.com', role: 'Editor', age: 39, status: 'active', score: 85 },
]

const ROLE_COLORS: Record<string, string> = {
  Admin: 'bg-blue-3lighter text-blue',
  Editor: 'bg-green/10 text-green-darker',
  Viewer: 'bg-bg text-gray',
}

const ROLES = ['Admin', 'Editor', 'Viewer']

// --- Simulated async page fetch ---------------------------------------------

function simulateFetch (page: number, pageSize: number): Promise<{ rows: User[]; total: number }> {
  return new Promise(resolve =>
    setTimeout(() => {
      const start = (page - 1) * pageSize
      resolve({ rows: SEED_DATA.slice(start, start + pageSize), total: SEED_DATA.length })
    }, 700),
  )
}

// --- Table demo (full-featured) ---------------------------------------------

function TableDemo () {
  const [data] = createSignal<User[]>(SEED_DATA)
  const [loading, setLoading] = createSignal(false)
  const [showScore, setShowScore] = createSignal(false)

  const table = createTable<User>({
    columns: [
      {
        key: 'name',
        title: 'Name',
        sortable: true,
        filterable: true,
        fixed: 'left',
        width: '150px',
      },
      {
        key: 'email',
        title: 'Email',
        filterable: true,
        width: '200px',
      },
      {
        key: 'role',
        title: 'Role',
        sortable: true,
        filterable: true,
        width: '120px',
        render: (val) => (
          <span class={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[String(val)] ?? ''}`}>
            {String(val)}
          </span>
        ),
      },
      {
        key: 'age',
        title: 'Age',
        sortable: true,
        align: 'center',
        width: '80px',
      },
      {
        key: 'status',
        title: 'Status',
        align: 'center',
        width: '100px',
        render: (val) => (
          <span class={`inline-flex items-center gap-1 text-xs font-medium ${val === 'active' ? 'text-green-darker' : 'text-gray-light'}`}>
            <span class={`w-1.5 h-1.5 rounded-full ${val === 'active' ? 'bg-green' : 'bg-gray-lighter'}`} />
            {String(val)}
          </span>
        ),
      },
      {
        // hidden 列：通过响应式 accessor 控制可见性，无需重建 table
        key: 'score',
        title: 'Score',
        sortable: true,
        align: 'right',
        width: '80px',
        hidden: () => !showScore(),
        render: (val) => {
          const n = Number(val)
          return (
            <span class={`font-mono text-xs font-semibold ${n >= 90 ? 'text-green-darker' : n >= 75 ? 'text-blue' : 'text-gray'}`}>
              {String(val)}
            </span>
          )
        },
      },
      {
        // isAction 列：头部显示全局表格菜单（列可见性、重置排序/过滤/pin/分组）
        key: 'actions',
        title: '操作',
        isAction: true,
        align: 'center',
        width: '120px',
        render: (_, row) => (
          <div class="flex items-center justify-center gap-3">
            <button
              class="text-xs text-blue hover:underline"
              onClick={e => { e.stopPropagation(); alert(`编辑：${row.name}`) }}
            >
              编辑
            </button>
            <button
              class="text-xs text-red hover:underline"
              onClick={e => { e.stopPropagation(); alert(`删除：${row.name}`) }}
            >
              删除
            </button>
          </div>
        ),
      },
    ],
    data,
    rowKey: (row) => String(row.id),
    pagination: true,
    selection: true,
    defaultPageSize: 5,
  })

  const hasFilters = () =>
    Object.values(table.filters()).some(v => v.trim()) ||
    Object.values(table.filterSelections()).some(v => v.length > 0)

  return (
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-black mb-1">Table — 全功能示例</h2>
      <p class="text-sm text-gray mb-1">
        排序 · 文本过滤 · 多选过滤 · 分页 · 行选择 · 自定义渲染 · 固定列（<code class="px-1 py-0.5 bg-bg rounded">fixed</code>）·
        动态 Pin · 行分组 · 列可见性 · Active Cell · 操作栏（<code class="px-1 py-0.5 bg-bg rounded">isAction</code>）·
        响应式隐藏列（<code class="px-1 py-0.5 bg-bg rounded">hidden</code>）· loading。
      </p>
      <p class="text-xs text-gray-light mb-4">
        点列标题右侧的 <b>▾</b> 展开列菜单（排序 / 过滤 / pin / 分组）；点 <b>⋮</b> 展开全局菜单（列可见性 / 重置）。
        点击任意单元格激活 Active Cell。
      </p>

      {/* ── Programmatic control strip ── */}
      <div class="flex flex-wrap gap-2 mb-3">
        <CtrlBtn active={loading()} onClick={() => setLoading(v => !v)}>
          {loading() ? '⏳ Loading 中…' : '模拟 Loading'}
        </CtrlBtn>
        <CtrlBtn active={showScore()} onClick={() => setShowScore(v => !v)}>
          {showScore() ? '隐藏 Score 列' : '显示 Score 列（hidden）'}
        </CtrlBtn>
        <CtrlBtn disabled={!table.sort()} onClick={table.clearSort}>
          清除排序
        </CtrlBtn>
        <CtrlBtn disabled={!hasFilters()} onClick={table.clearFilters}>
          清除过滤
        </CtrlBtn>
        <CtrlBtn
          active={table.groupKey() === 'role'}
          onClick={() => table.setGroupKey(table.groupKey() === 'role' ? null : 'role')}
        >
          {table.groupKey() === 'role' ? '取消 Role 分组' : '按 Role 分组'}
        </CtrlBtn>
        <CtrlBtn disabled={table.pinnedKeys().length === 0} onClick={table.clearAllPins}>
          取消所有 Pin
        </CtrlBtn>
        <CtrlBtn disabled={table.hiddenKeys().length === 0} onClick={table.resetColumnVisibility}>
          重置列可见性
        </CtrlBtn>
        <Show when={table.selectedKeys().length > 0}>
          <CtrlBtn active onClick={table.clearSelection}>
            清除选择（{table.selectedKeys().length} 行）
          </CtrlBtn>
        </Show>
      </div>

      {/* ── Live state badges ── */}
      <Show when={
        table.sort() || table.groupKey() || table.activeCell() ||
        table.pinnedKeys().length > 0 || table.hiddenKeys().length > 0 || hasFilters()
      }>
        <div class="mb-3 flex flex-wrap gap-2">
          <Show when={table.sort()}>
            <StateBadge label="排序" value={`${table.sort()!.key} ${table.sort()!.dir === 'asc' ? '↑' : '↓'}`} />
          </Show>
          <Show when={table.groupKey()}>
            <StateBadge label="分组" value={table.groupKey()!} />
          </Show>
          <Show when={hasFilters()}>
            <StateBadge label="过滤" value="已激活" muted />
          </Show>
          <Show when={table.pinnedKeys().length > 0}>
            <StateBadge label="Pin" value={table.pinnedKeys().join(', ')} />
          </Show>
          <Show when={table.hiddenKeys().length > 0}>
            <StateBadge label="隐藏列" value={table.hiddenKeys().join(', ')} muted />
          </Show>
          <Show when={table.activeCell()}>
            <StateBadge
              label="Active Cell"
              value={`行 ${table.activeCell()!.rowKey} / 列 ${table.activeCell()!.colKey}`}
            />
          </Show>
        </div>
      </Show>

      <Table
        table={table}
        loading={() => loading()}
        emptyText="暂无数据 — 尝试清除过滤条件"
        pageSizeOptions={[5, 10, 20]}
      />
    </section>
  )
}

// --- Server pagination demo -------------------------------------------------

function ServerPaginationDemo () {
  const [rows, setRows] = createSignal<User[]>([])
  const [total, setTotal] = createSignal(0)
  const [isLoading, setIsLoading] = createSignal(true)

  const table = createTable<User>({
    columns: [
      { key: 'id', title: 'ID', align: 'center', width: '60px' },
      { key: 'name', title: 'Name', width: '160px' },
      {
        key: 'role',
        title: 'Role',
        width: '120px',
        render: (val) => (
          <span class={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[String(val)] ?? ''}`}>
            {String(val)}
          </span>
        ),
      },
      { key: 'age', title: 'Age', align: 'right', width: '80px' },
      {
        key: 'status',
        title: 'Status',
        align: 'center',
        width: '100px',
        render: (val) => (
          <span class={`inline-flex items-center gap-1 text-xs font-medium ${val === 'active' ? 'text-green-darker' : 'text-gray-light'}`}>
            <span class={`w-1.5 h-1.5 rounded-full ${val === 'active' ? 'bg-green' : 'bg-gray-lighter'}`} />
            {String(val)}
          </span>
        ),
      },
      { key: 'score', title: 'Score', align: 'right', width: '80px' },
    ],
    data: rows,
    rowKey: row => String(row.id),
    serverPagination: true,
    externalTotal: total,
    defaultPageSize: 4,
  })

  // Re-fetch whenever page or pageSize changes
  createEffect(() => {
    const p = table.page()
    const ps = table.pageSize()
    setIsLoading(true)
    simulateFetch(p, ps).then(res => {
      setRows(res.rows)
      setTotal(res.total)
      setIsLoading(false)
    })
  })

  return (
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-black mb-1">Table — 服务端分页</h2>
      <p class="text-sm text-gray mb-4">
        <code class="px-1 py-0.5 bg-bg rounded text-xs">serverPagination: true</code> +{' '}
        <code class="px-1 py-0.5 bg-bg rounded text-xs">externalTotal</code>：
        表格不做客户端切片，翻页时触发外部 fetch，模拟 700 ms 网络延迟。
      </p>
      <Table table={table} loading={() => isLoading()} pageSizeOptions={[4, 8]} />
    </section>
  )
}

// --- Form demo --------------------------------------------------------------

type ProfileForm = {
  username: string
  email: string
  age: number
  bio: string
  role: string
}

function FormDemo () {
  const { toast } = usePageContext()
  const [submitted, setSubmitted] = createSignal<ProfileForm | null>(null)

  const form = createForm<ProfileForm>({
    initialValues: {
      username: '',
      email: '',
      age: 0,
      bio: '',
      role: 'Viewer',
    },
    rules: {
      username: [required(), minLength(2), maxLength(USERNAME_MAX)],
      email: [required(), email()],
      age: [required(), min(1), max(AGE_MAX)],
      bio: [maxLength(BIO_MAX)],
      role: [required()],
    },
    validateOn: 'blur',
  })

  async function handleSubmit () {
    const ok = await form.submit((values) => {
      setSubmitted({ ...values } as ProfileForm)
    })
    if (ok) {
      toast('提交成功！', { type: TipType.SUCCESS })
    } else {
      toast('请修正表单错误', { type: TipType.ERROR })
    }
  }

  function handleReset () {
    form.reset()
    setSubmitted(null)
  }

  return (
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-black mb-1">Form</h2>
      <p class="text-sm text-gray mb-4">受控表单、验证规则、级联、提交。</p>

      <div class="grid grid-cols-1 gap-8" style={{ 'grid-template-columns': 'repeat(auto-fit, minmax(16rem, 1fr))' }}>
        {/* Form fields */}
        <div class="bg-white border border-gray-100 rounded-lg p-6 flex flex-col gap-4">

          <Field label="用户名" error={form.error('username')}>
            <input
              type="text"
              placeholder="2–30 个字符"
              class={inputClass(!!form.error('username'))}
              {...form.bind('username')}
            />
          </Field>

          <Field label="邮箱" error={form.error('email')}>
            <input
              type="email"
              placeholder="user@example.com"
              class={inputClass(!!form.error('email'))}
              {...form.bind('email')}
            />
          </Field>

          <Field label="年龄" error={form.error('age')}>
            <input
              type="number"
              placeholder="1–120"
              class={inputClass(!!form.error('age'))}
              {...form.bindNumber('age')}
            />
          </Field>

          <Field label="角色" error={form.error('role')}>
            <select
              class={inputClass(!!form.error('role'))}
              {...form.bindSelect('role')}
            >
              <For each={ROLES}>
                {r => <option value={r}>{r}</option>}
              </For>
            </select>
          </Field>

          <Field label="简介（选填）" error={form.error('bio')}>
            <textarea
              rows={3}
              placeholder="最多 200 字"
              class={inputClass(!!form.error('bio'))}
              value={form.value('bio')}
              onInput={e => form.setValue('bio', (e.currentTarget as HTMLTextAreaElement).value)}
              onBlur={() => form.setTouched('bio')}
            />
          </Field>

          <div class="flex gap-3 pt-2">
            <Button
              class="flex-1 py-2 rounded-lg bg-blue text-white font-medium text-sm"
              onClick={handleSubmit}
              loading={() => form.isSubmitting()}
            >
              提交
            </Button>
            <button
              class="flex-1 py-2 rounded-lg border border-gray-100 text-gray text-sm hover:bg-bg transition-colors"
              onClick={handleReset}
            >
              重置
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div class="bg-bg border border-gray-100 rounded-lg p-6">
          <p class="text-xs text-gray-light mb-3 font-medium uppercase tracking-wide">表单状态预览</p>
          <Show
            when={submitted()}
            fallback={
              <dl class="text-sm space-y-2">
                <StateRow label="用户名" value={form.value('username') || '—'} />
                <StateRow label="邮箱" value={form.value('email') || '—'} />
                <StateRow label="年龄" value={String(form.value('age') || '—')} />
                <StateRow label="角色" value={form.value('role')} />
                <StateRow label="是否有效" value={form.isValid() ? '✓ 是' : '✗ 否'} />
                <StateRow label="是否修改" value={form.isDirty() ? '是' : '否'} />
              </dl>
            }
          >
            {(data) => (
              <div>
                <p class="text-sm text-green-darker font-medium mb-3">提交成功的数据：</p>
                <pre class="text-xs bg-white border border-gray-100 rounded p-3 overflow-auto">
                  {JSON.stringify(data(), null, 2)}
                </pre>
              </div>
            )}
          </Show>
        </div>
      </div>
    </section>
  )
}

// --- Helpers ----------------------------------------------------------------

type CtrlBtnProps = ParentProps<{
  active?: boolean
  disabled?: boolean
  onClick: () => void
}>

function CtrlBtn (props: CtrlBtnProps) {
  return (
    <button
      class={[
        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
        props.disabled
          ? 'opacity-40 cursor-not-allowed border-gray-100 text-gray bg-white'
          : props.active
            ? 'border-gray-100 text-blue bg-blue-3lighter'
            : 'border-gray-100 text-gray bg-white hover:bg-bg',
      ].join(' ')}
      onClick={() => !props.disabled && props.onClick()}
    >
      {props.children}
    </button>
  )
}

function StateBadge (props: { label: string; value: string; muted?: boolean }) {
  return (
    <span class={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${props.muted ? 'bg-bg text-gray border-gray-100' : 'bg-blue-3lighter text-blue border-gray-100'}`}>
      <span class="opacity-60">{props.label}:</span>
      <b>{props.value}</b>
    </span>
  )
}

function inputClass (hasError: boolean) {
  return [
    'w-full px-3 py-2 text-sm rounded-lg border bg-white transition-colors',
    'focus:outline-none focus:ring-2',
    hasError
      ? 'border-red focus:ring-red/20'
      : 'border-gray-100 focus:border-blue focus:ring-blue/10',
  ].join(' ')
}

type FieldProps = ParentProps<{
  label: string
  error: string | null
}>

function Field (props: FieldProps) {
  return (
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-black">{props.label}</label>
      {props.children as JSXElement}
      <Show when={props.error}>
        <p class="text-xs text-red">{props.error}</p>
      </Show>
    </div>
  )
}

function StateRow (props: { label: string; value: string }) {
  return (
    <div class="flex justify-between gap-2">
      <dt class="text-gray-light shrink-0">{props.label}</dt>
      <dd class="text-black truncate">{props.value}</dd>
    </div>
  )
}

// --- Page root --------------------------------------------------------------

export default function Example () {
  return (
    <div class="min-h-screen bg-bg px-4 py-8 max-w-4xl mx-auto">
      <header class="mb-10">
        <h1 class="text-2xl font-bold text-black">Components Example</h1>
        <p class="text-sm text-gray mt-1">Table & Form feature 使用示例</p>
      </header>
      <TableDemo />
      <ServerPaginationDemo />
      <FormDemo />
    </div>
  )
}