import Icon from '@/components/Icon'
import { createSignal, JSX, splitProps } from 'solid-js'
import Input from './Input'

type PasswordInputProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'type' | 'prefix'> & {
  error?: boolean | string | null
  prefix?: JSX.Element
}

/**
 * Password input with a built-in show/hide toggle.
 * Accepts the same props as `Input` (minus `type`).
 *
 * ```tsx
 * <PasswordInput {...form.bind('password')} prefix={<Icon name="lock-outline" set="mdi" />} />
 * ```
 */
export default function PasswordInput (props: PasswordInputProps) {
  const [local, rest] = splitProps(props, ['prefix'])
  const [show, setShow] = createSignal(false)

  return (
    <Input
      {...rest}
      type={show() ? 'text' : 'password'}
      prefix={local.prefix}
      suffix={
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          class="flex items-center justify-center p-1.5 rounded-lg bg-transparent border-0 cursor-pointer text-[var(--c-input-icon)] hover:text-c-text transition-colors"
        >
          <Icon name={show() ? 'eye-off-outline' : 'eye-outline'} set="mdi" />
        </button>
      }
    />
  )
}
