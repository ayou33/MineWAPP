import { t } from '@/features/i18n'
import { A } from '@/router'
import Button from '@/components/Button'
import usePageContext from '@/hooks/usePageContext'
import { TipType } from '@/config'

export default function About () {
  const { toast } = usePageContext()

  function handleToast () {
    toast(t('demo.toast_message'), { type: TipType.SUCCESS })
  }

  return (
    <div class="flex flex-col items-center justify-center min-h-screen px-4">
      <h2 class="text-2xl font-semibold mb-4">{t('nav.about')}</h2>

      <p class="mb-8 text-center max-w-md">
        {t('about.description')}
      </p>

      <div class="flex gap-4 mb-8">
        <Button onClick={handleToast}>
          {t('demo.show_toast')}
        </Button>
      </div>

      <A href="/" class="text-theme-primary underline">
        {t('nav.home')}
      </A>
    </div>
  )
}
