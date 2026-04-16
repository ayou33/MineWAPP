import application from '@/app/application'
import ContentLoading from '@/components/loading/Loading.content'
import { Show } from 'solid-js'

export default function PageLoading () {
  return (
    <div class="absolute inset-0 size-full z-focus flex items-center justify-center">
      <Show when={application.isPC} fallback={
        <ContentLoading />
      }>
        <div class="mx-auto size-6 aspect-square text-black/33 rounded-full border-solid border-2 border-l-transparent animate-spin"></div>
      </Show>
    </div>
  )
}
