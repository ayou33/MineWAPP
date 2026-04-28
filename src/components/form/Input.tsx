import classNames from 'classnames'
import { createEffect, JSX, splitProps } from 'solid-js'

type InputProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix'> & {
  /** Shows error-state border when truthy; pass the error string or a boolean. */
  error?: boolean | string | null
  /** Left slot — typically an Icon. Adds left padding automatically. */
  prefix?: JSX.Element
  /** Right slot — typically an action button or icon. */
  suffix?: JSX.Element
}

const BASE = [
  'w-full py-3 text-sm text-c-text rounded-xl border',
  'bg-[var(--c-input-outlined-bg)]',
  'placeholder:text-[var(--c-input-placeholder)]',
  'outline-none transition-[border-color,box-shadow] duration-150',
  'disabled:opacity-40 disabled:cursor-not-allowed',
].join(' ')

/**
 * MD3 Outlined text input.
 *
 * Uses a ref + createEffect to sync value imperatively instead of
 * a reactive `value` prop — this prevents SolidJS from calling
 * `el.value = x` after every keystroke (which resets cursor position).
 */
export default function Input (props: InputProps) {
  let ref: HTMLInputElement | null = null

  // Rendering-specific props
  const [local, rest] = splitProps(props, ['error', 'prefix', 'suffix', 'class'])
  // Controlled/reactive props — extracted so the remaining spread is static
  const [controlled, nativeRest] = splitProps(rest, ['value', 'onInput', 'onBlur', 'type'])

  // Sync value to DOM imperatively; guard prevents cursor-reset during typing
  createEffect(() => {
    const v = String(controlled.value ?? '')
    if (ref && ref.value !== v) ref.value = v
  })

  const hasError = () => Boolean(local.error)

  const borderClass = () => hasError()
    ? 'border-[var(--c-input-outlined-border-error)] focus:border-[var(--c-input-outlined-border-error)] focus:shadow-[0_0_0_3px_rgba(246,77,75,0.15)]'
    : 'border-[var(--c-input-outlined-border)] focus:border-[var(--c-input-outlined-border-focus)] focus:shadow-[0_0_0_3px_var(--state-focus)]'

  const paddingClass = () => {
    if (local.prefix && local.suffix) return 'pl-10 pr-11'
    if (local.prefix) return 'pl-10 pr-4'
    if (local.suffix) return 'pl-4 pr-11'
    return 'px-4'
  }

  return (
    <div class="relative flex items-center">

      {local.prefix && (
        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-c-input-icon pointer-events-none flex items-center">
          {local.prefix}
        </span>
      )}

      <input
        ref={(el) => { ref = el }}
        {...nativeRest}
        type={controlled.type ?? 'text'}
        onInput={controlled.onInput}
        onBlur={controlled.onBlur}
        class={classNames(BASE, borderClass(), paddingClass(), local.class)}
      />

      {local.suffix && (
        <span class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          {local.suffix}
        </span>
      )}

    </div>
  )
}
