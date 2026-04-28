import { For, splitProps } from 'solid-js'

export type ButtonGroupOption = {
  label: string
  value: string | number
  /** Per-option accent color for the active state. */
  color?: string
}

export type ButtonGroupProps = {
  options: ButtonGroupOption[]
  value: string | number | null | undefined
  onChange: (value: string | number) => void
  /**
   * `segmented` (default): joined buttons sharing one outer border — for form fields.
   * `pill`: separated rounded buttons with gap — for compact toolbars.
   */
  variant?: 'segmented' | 'pill'
  /**
   * Active state style when `color` is set on an option:
   * `tint` (default): translucent tinted bg + colored text.
   * `solid`: fully opaque bg + white text.
   */
  activeStyle?: 'tint' | 'solid'
  /**
   * Button height / text size:
   * `sm` — py-2.5 text-xs, for compact status selectors.
   * `md` — py-3 text-sm, standard (default).
   */
  size?: 'sm' | 'md'
  class?: string
}

export default function ButtonGroup (props: ButtonGroupProps) {
  const [local] = splitProps(props, [
    'options', 'value', 'onChange', 'variant', 'activeStyle', 'size', 'class',
  ])

  const isPill = () => local.variant === 'pill'
  const isSolid = () => local.activeStyle === 'solid'
  const isSmall = () => local.size === 'sm'

  const btnClass = () => [
    isPill()
      ? 'rounded-lg px-2.5 py-1 text-xs'
      : `flex-1 ${isSmall() ? 'py-2.5 text-xs' : 'py-3 text-sm'}`,
    'font-medium transition-colors border-0 cursor-pointer',
  ].join(' ')

  return (
    <div
      class={[
        'flex',
        isPill() ? 'gap-1' : 'rounded-xl overflow-hidden border',
        local.class,
      ].filter(Boolean).join(' ')}
      style={isPill() ? {} : { 'border-color': 'var(--c-input-outlined-border)' }}
    >
      <For each={local.options}>
        {(opt, i) => {
          const active = () => local.value === opt.value

          const bgColor = () => {
            if (!active()) return isPill() ? 'var(--md-surface-variant)' : 'var(--c-input-outlined-bg)'
            if (opt.color) return isSolid() ? opt.color : `color-mix(in srgb, ${opt.color} 18%, transparent)`
            return 'var(--md-primary-container)'
          }

          const textColor = () => {
            if (!active()) return 'var(--c-text-muted)'
            if (opt.color && isSolid()) return '#fff'
            return opt.color ?? 'var(--md-on-primary-container)'
          }

          return (
            <button
              type="button"
              class={btnClass()}
              style={{
                background: bgColor(),
                color: textColor(),
                ...(!isPill() && i() < local.options.length - 1
                  ? { 'border-right': '1px solid var(--c-input-outlined-border)' }
                  : {}),
              }}
              onClick={() => local.onChange(opt.value)}
            >
              {opt.label}
            </button>
          )
        }}
      </For>
    </div>
  )
}
