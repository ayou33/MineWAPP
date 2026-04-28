import Icon from '@/components/Icon'
import { t } from '@/features/i18n'
import { A } from '@/router'

export default function Home () {
  return (
    <div class="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-blue to-white px-4">
      <h1 class="text-4xl font-bold text-theme-primary mb-4">
        {t('app.title')}
      </h1>
      <p class="text-lg text-gray-500 mb-8">
        {t('app.description')}
      </p>

      <div class="flex gap-4">
        <A href="/about" class="px-6 py-3 bg-theme-primary text-white rounded-lg shadow hover:opacity-90 transition">
          {t('nav.about')}
        </A>
        <Icon name="sunny-loop" size={24} />
      </div>
      
      <div class="mt-16 text-sm text-gray-400">
        SolidJS + Vite + TailwindCSS
      </div>
    </div>
  )
}
