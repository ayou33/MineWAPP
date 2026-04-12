import { emit } from '@/common/event'
import Button from '@/components/Button'
import Icon from '@/components/Icon'
import { FormItem, Input, PasswordInput } from '@/components/form'
import { EVENTS, TipType } from '@/config'
import { t } from '@/features/i18n'
import createForm from '@/features/form/createForm'
import { required, minLength } from '@/features/form/rules'
import usePageContext from '@/hooks/usePageContext'
import { isDark, toggleTheme } from '@/hooks/useTheme'
import application from '@/app/application'
import { useNavigate } from '@solidjs/router'

type LoginValues = { username: string; password: string }

export default function AuthForm () {
  const navigate = useNavigate()
  const { toast } = usePageContext()

  const form = createForm<LoginValues>({
    initialValues: { username: '', password: '' },
    rules: {
      username: [required('请输入账号 / 用户名')],
      password: [required('请输入密码'), minLength(6, '密码至少 6 位')],
    },
    validateOn: 'blur',
  })

  async function handleLogin () {
    await form.submit(async (values) => {
      // TODO: replace with real API call
      await new Promise(r => setTimeout(r, 800))

      application.login({
        group: 1,
        userId: Date.now(),
        token: 'mock-token',
        name: values.username,
      })

      emit(EVENTS.LOGIN)
      toast(t('auth.login_success'), { type: TipType.SUCCESS })
      navigate('/', { replace: true })
    })
  }

  return (
    <div class="w-full max-w-[400px]">

      {/* Top bar: home link + theme toggle */}
      <div class="flex items-center justify-between mb-10">
        <a
          href="/"
          class="flex items-center gap-1.5 text-sm text-c-text-muted no-underline hover:text-c-text transition-colors"
        >
          <Icon name="ArrowLeft" size={15} />
          返回首页
        </a>
        <button
          onClick={(e) => toggleTheme(e)}
          title={isDark() ? '切换浅色模式' : '切换深色模式'}
          class="flex items-center justify-center w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer text-c-text-muted hover:bg-[var(--state-hover)] hover:text-c-text transition-colors"
        >
          <Icon name={isDark() ? 'Sun' : 'Moon'} size={17} />
        </button>
      </div>

      {/* Heading */}
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-c-text mb-2">欢迎登录</h1>
        <p class="text-sm text-c-text-muted">登录你的 MIMC MCN 管理账号</p>
      </div>

      {/* Form fields */}
      <div class="flex flex-col gap-4">

        <FormItem label="账号 / 用户名" required error={form.error('username')}>
          <Input
            {...form.bind('username')}
            type="text"
            placeholder={t('auth.username')}
            prefix={<Icon name="User" size={16} />}
            error={form.error('username')}
          />
        </FormItem>

        <FormItem label="密码" required error={form.error('password')}>
          <PasswordInput
            {...form.bind('password')}
            placeholder={t('auth.password')}
            prefix={<Icon name="Lock" size={16} />}
            error={form.error('password')}
            onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && handleLogin()}
          />
        </FormItem>

        {/* Forgot password */}
        <div class="flex justify-end -mt-1">
          <a href="#" class="text-xs text-[var(--md-primary)] no-underline hover:underline">
            忘记密码？
          </a>
        </div>

        {/* Submit */}
        <Button
          onClick={handleLogin}
          class="w-full py-3 mt-1 rounded-xl text-sm font-semibold border-0 cursor-pointer transition-all bg-c-btn-filled-bg text-c-btn-filled-text shadow-[var(--c-btn-filled-shadow)] hover:bg-c-btn-filled-hover-bg hover:shadow-[0_4px_16px_rgba(46,96,249,0.4)] hover:-translate-y-px active:translate-y-0"
        >
          {t('auth.login')}
        </Button>

      </div>

      {/* Footer note */}
      <p class="text-center text-xs text-c-text-subtle mt-8">
        登录即表示同意
        <a href="#" class="text-[var(--md-primary)] no-underline hover:underline mx-1">服务条款</a>
        与
        <a href="#" class="text-[var(--md-primary)] no-underline hover:underline mx-1">隐私政策</a>
      </p>

    </div>
  )
}
