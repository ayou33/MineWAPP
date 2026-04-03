import ContentLoading from '@/components/loading/Loading.content'

export default function PageLoading () {
  return (
    <div class="absolute size-full bg-theme-primary z-focus">
      <div>
        <div class="h-12 bg-bluegray-lighter/30"></div>
        
        <ContentLoading />
      </div>
    </div>
  )
}
