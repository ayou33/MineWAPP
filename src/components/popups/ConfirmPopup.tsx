import Icon from '@/components/Icon'
import type { PopupProps } from './Popups'

export type ConfirmPopupProps = PopupProps<{
  message?: string
  detail?: string
  /** Label for the confirm button (default: "确认") */
  confirmLabel?: string
  /** CSS color for the confirm button bg (default: --md-error) */
  confirmColor?: string
}, boolean>

export default function ConfirmPopup (props: ConfirmPopupProps) {
  const confirmColor = () => props.confirmColor ?? 'var(--md-error)'
  const confirmLabel = () => props.confirmLabel ?? '确认'

  return (
    <div class="flex flex-col gap-5 min-w-80">

      {/* Icon + message */}
      <div class="flex flex-col items-center gap-3 pt-2 text-center">
        <span
          class="flex items-center justify-center w-12 h-12 rounded-full"
          style={{ background: `color-mix(in srgb, ${confirmColor()} 12%, transparent)` }}
        >
          <Icon name="alert-circle-outline" set="mdi" size={26} color={confirmColor()} />
        </span>

        <p class="text-sm font-medium text-c-text leading-snug">
          {props.message ?? '确认执行此操作？'}
        </p>

        {props.detail && (
          <p class="text-xs text-c-text-muted leading-relaxed -mt-1">
            {props.detail}
          </p>
        )}
      </div>

      {/* Actions */}
      <div class="flex gap-3">
        <button
          type="button"
          class="flex-1 py-2.5 text-sm font-medium rounded-xl border cursor-pointer transition-colors hover:bg-[var(--state-hover)]"
          style={{ 'border-color': 'var(--c-outline)', color: 'var(--c-text-muted)', background: 'transparent' }}
          onClick={() => props.close(false)}
        >
          取消
        </button>
        <button
          type="button"
          class="flex-1 py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-opacity hover:opacity-90 border-0"
          style={{ background: confirmColor(), color: '#fff' }}
          onClick={() => props.close(true)}
        >
          {confirmLabel()}
        </button>
      </div>
    </div>
  )
}
