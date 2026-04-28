import { Accessor, JSX, ParentProps, Show } from 'solid-js'
import Button from '@/components/Button'
import classNames from 'classnames'

export type FormPopupProps = ParentProps<{
  /** Label for the cancel button (default: "取消") */
  cancelLabel?: string
  /** Label for the confirm button (default: "确认") */
  confirmLabel?: string
  /** Called when the cancel button is clicked */
  onCancel?: () => void
  /** Called when the confirm button is clicked */
  onConfirm?: () => void
  /** Reactive signal accessor — while truthy the confirm button shows a loading state */
  submitting?: Accessor<boolean>
  /** Disables the confirm button without showing the loading state */
  disabled?: boolean
  class?: string
  style?: JSX.CSSProperties
  /** Dialog content width on PC (default: '560px'). Accepts CSS string or pixel number. */
  width?: string | number
}>

/**
 * FormPopup — reusable popup shell with a bottom-fixed action bar.
 *
 * Renders the form content passed as `children` above a sticky action bar
 * that contains Cancel and Confirm buttons. Both labels and click handlers
 * are fully customisable; sensible defaults ("取消" / "确认") are provided.
 *
 * Usage:
 * ```tsx
 * <FormPopup
 *   onCancel={() => props.close()}
 *   onConfirm={handleSubmit}
 *   confirmLabel="保存"
 *   submitting={submitting}
 * >
 *   <FormItem ...>...</FormItem>
 * </FormPopup>
 * ```
 */
export default function FormPopup (props: FormPopupProps) {
  const width = () => {
    const w = props.width ?? '560px'
    return typeof w === 'number' ? `${w}px` : w
  }

  return (
    <div
      class={classNames('flex flex-col h-full max-h-[70vh] max-w-300', props.class)}
      style={{ width: width(), ...props.style }}
    >
      {/* ── Scrollable form content ───────────────────────────────── */}
      <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
        {props.children}
      </div>

      {/* ── Bottom action bar ────────────────────────────────────── */}
      <div
        class="flex items-center justify-end gap-3 pt-3 shrink-0"
      >
        <button
          type="button"
          class="px-5 py-2 text-sm font-medium rounded-xl border cursor-pointer transition-colors hover:bg-[var(--state-hover)]"
          style={{ 'border-color': 'var(--c-outline)', color: 'var(--c-text-muted)', background: 'transparent' }}
          onClick={props.onCancel}
        >
          {props.cancelLabel ?? '取消'}
        </button>

        <Show
          when={!props.submitting?.()}
          fallback={
            <button
              class="px-5 py-2 rounded-xl text-sm font-medium opacity-60 cursor-not-allowed border-0"
              style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
              disabled
            >
              提交中…
            </button>
          }
        >
          <Button
            class="px-5 py-2 rounded-xl text-sm font-medium border-0 cursor-pointer"
            style={{ background: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
            confirmable={false}
            disabled={props.disabled}
            onClick={props.onConfirm}
          >
            {props.confirmLabel ?? '确认'}
          </Button>
        </Show>
      </div>
    </div>
  )
}
