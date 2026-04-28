import { createTable, Table } from '@/features/table'
import { createForm, required, minLength, maxLength, min, max, email } from '@/features/form'
import Button from '@/components/Button'
import usePageContext from '@/hooks/usePageContext'
import { TipType } from '@/config'
import { createSignal, For, JSXElement, ParentProps, Show } from 'solid-js'

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
}

const SEED_DATA: User[] = [
  { id: 1, name: 'Alice Chen', email: 'alice@example.com', role: 'Admin', age: 28, status: 'active' },
  { id: 2, name: 'Bob Wang', email: 'bob@example.com', role: 'Editor', age: 34, status: 'active' },
  { id: 3, name: 'Carol Li', email: 'carol@example.com', role: 'Viewer', age: 22, status: 'inactive' },
  { id: 4, name: 'David Zhang', email: 'david@example.com', role: 'Editor', age: 41, status: 'active' },
  { id: 5, name: 'Eve Zhao', email: 'eve@example.com', role: 'Admin', age: 29, status: 'active' },
  { id: 6, name: 'Frank Liu', email: 'frank@example.com', role: 'Viewer', age: 55, status: 'inactive' },
  { id: 7, name: 'Grace Wu', email: 'grace@example.com', role: 'Editor', age: 37, status: 'active' },
  { id: 8, name: 'Henry Xu', email: 'henry@example.com', role: 'Viewer', age: 26, status: 'inactive' },
  { id: 9, name: 'Iris Sun', email: 'iris@example.com', role: 'Admin', age: 31, status: 'active' },
  { id: 10, name: 'Jack Hu', email: 'jack@example.com', role: 'Editor', age: 48, status: 'active' },
  { id: 11, name: 'Kelly Yang', email: 'kelly@example.com', role: 'Viewer', age: 24, status: 'inactive' },
  { id: 12, name: 'Leo Guo', email: 'leo@example.com', role: 'Editor', age: 39, status: 'active' },
]

const ROLE_COLORS: Record<string, string> = {
  Admin: 'bg-blue-3lighter text-blue',
  Editor: 'bg-green/10 text-green-darker',
  Viewer: 'bg-bg text-gray',
}

const ROLES = ['Admin', 'Editor', 'Viewer']

// --- Table demo -------------------------------------------------------------

function TableDemo () {
  const [data] = createSignal<User[]>(SEED_DATA)

  const table = createTable<User>({
    columns: [
      {
        key: 'name',
        title: 'Name',
        sortable: true,
        filterable: true,
        fixed: 'left',
        width: 150,
      },
      {
        key: 'email',
        title: 'Email',
        filterable: true,
        width: 200,
      },
      {
        key: 'role',
        title: 'Role',
        sortable: true,
        filterable: true,
        width: 100,
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
        width: 80,
      },
      {
        key: 'status',
        title: 'Status',
        align: 'center',
        width: 100,
        render: (val) => (
          <span class={`inline-flex items-center gap-1 text-xs font-medium ${val === 'active' ? 'text-green-darker' : 'text-gray-light'}`}>
            <span class={`w-1.5 h-1.5 rounded-full ${val === 'active' ? 'bg-green' : 'bg-gray-lighter'}`} />
            {String(val)}
          </span>
        ),
      },
    ],
    data,
    rowKey: (row) => String(row.id),
    pagination: true,
    selection: true,
    defaultPageSize: 5,
  })

  return (
    <section class="mb-12">
      <h2 class="text-lg font-semibold text-black mb-1">Table</h2>
      <p class="text-sm text-gray mb-4">排序、筛选、分页、行选择、自定义渲染、固定列。</p>

      <Show when={table.selectedKeys().length > 0}>
        <div class="mb-3 px-3 py-2 rounded bg-blue-3lighter text-blue text-sm">
          已选中 {table.selectedKeys().length} 行：{table.selectedKeys().join(', ')}
          <button
            class="ml-3 text-xs underline opacity-70 hover:opacity-100"
            onClick={table.clearSelection}
          >
            清除
          </button>
        </div>
      </Show>

      <Table table={table} />
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
      <FormDemo />
    </div>
  )
}