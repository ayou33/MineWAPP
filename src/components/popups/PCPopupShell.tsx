import { ParentProps, Show } from 'solid-js'
import Icon from '@/components/Icon'

type PCPopupShellProps = ParentProps<{
  title?: string
  onClose: VoidFn
}>

export default function PCPopupShell (props: PCPopupShellProps) {
  return (
    <div
      class="bg-c-dialog-bg rounded-2xl w-fit min-w-[400px] max-w-[80vw] max-h-[85vh] flex flex-col overflow-hidden"
      style={{ 'box-shadow': 'var(--md-shadow-dialog)' }}
    >
      {/* Title bar — always rendered on PC */}
      <div class="flex items-center justify-between px-6 py-4 border-b border-c-outline shrink-0">
        <h3 class="text-base font-semibold text-c-text leading-none">
          <Show when={props.title}>{props.title}</Show>
        </h3>
        <button
          class="p-1.5 rounded-full hover:bg-[var(--state-hover)] text-c-text-muted transition-colors"
          onClick={() => props.onClose()}
          aria-label="关闭"
        >
          <Icon name="close" set="mdi" size={18} />
        </button>
      </div>

      {/* Scrollable content area — uniform p-5 so children need no outer padding */}
      <div class="flex-1 overflow-y-auto p-5">
        {props.children}
      </div>
    </div>
  )
}
