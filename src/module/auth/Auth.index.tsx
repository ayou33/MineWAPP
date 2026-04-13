import { emit } from '@/common/event'
import Button from '@/components/Button'
import { EVENTS, TipType } from '@/config'
import { t } from '@/features/i18n'
import usePageContext from '@/hooks/usePageContext'
import application from '@/app/application'
import { useNavigate } from '@solidjs/router'
import { createSignal } from 'solid-js'

export default function Auth () {
  const navigate = useNavigate()
  const { toast } = usePageContext()

  const [username, setUsername] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [loading, setLoading] = createSignal(false)

  async function handleLogin () {
    const name = username().trim()
    const pwd = password().trim()

    if (!name || !pwd) {
      toast(t('auth.empty_fields'), { type: TipType.WARNING })
      return
    }

    setLoading(true)

    try {
      // TODO: replace with real API call
      await new Promise(r => setTimeout(r, 800))

      application.login({
        userId: Date.now(),
        token: 'mock-token',
        name,
      })

      emit(EVENTS.LOGIN)
      toast(t('auth.login_success'), { type: TipType.SUCCESS })
      navigate('/', { replace: true })
    } catch {
      toast(t('auth.login_failed'), { type: TipType.ERROR })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-b from-blue-3lighter to-white">
      <h1 class="text-3xl font-bold text-blue mb-8">{t('auth.title')}</h1>

      <div class="w-full max-w-sm flex flex-col gap-4">
        <input
          type="text"
          placeholder={t('auth.username')}
          value={username()}
          onInput={e => setUsername(e.currentTarget.value)}
          class="w-full px-4 py-3 rounded-lg border border-gray-lighter bg-white text-black outline-hidden focus:border-blue transition"
        />

        <input
          type="password"
          placeholder={t('auth.password')}
          value={password()}
          onInput={e => setPassword(e.currentTarget.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          class="w-full px-4 py-3 rounded-lg border border-gray-lighter bg-white text-black outline-hidden focus:border-blue transition"
        />

        <Button
          onClick={handleLogin}
          loading={loading}
          class="w-full py-3 bg-blue text-white rounded-lg font-semibold hover:opacity-90 transition"
        >
          {t('auth.login')}
        </Button>
      </div>
    </div>
  )
}
