import Icon from '@/components/Icon'
import { JSX, Show } from 'solid-js'

type FormItemProps = {
  label?: string
  required?: boolean
  error?: string | null
  helper?: string
  children: JSX.Element
}

/**
 * Layout wrapper for a single form field.
 *
 * TWO anti-flicker techniques are applied here:
 *
 * 1. `untrack(() => props.children)` — `props.children` is a JSX getter that
 *    reads `form.error()` as a reactive dep (via the inner Input's error prop).
 *    Without untrack the SolidJS insertion effect re-runs when error changes,
 *    destroying and re-creating the Input DOM node (focus loss + flicker).
 *    untrack breaks that dep; Input's own fine-grained effects still update
 *    its border/class reactively via its own tracking context.
 *
 * 2. Fixed-height error slot — the slot is `h-[1.125rem]` and *always* occupies
 *    that space when an `error` prop is wired up. Only opacity transitions.
 *    A max-height animation would change the form's total height on every frame
 *    which, on a `flex items-center` container, visibly shifts the whole page.
 */
export default function FormItem (props: FormItemProps) {
  const showError = () => !!props.error
  const message = () => props.error || props.helper || ''

  return (
    <div class="flex flex-col gap-1">

      <Show when={props.label}>
        <label class="flex items-center gap-0.5 text-xs font-medium text-c-text-muted tracking-wide">
          {props.label}
          <Show when={props.required}>
            <span class="text-[var(--md-error)] ml-0.5">*</span>
          </Show>
        </label>
      </Show>

      {props.children}

      {/*
        Fixed-height slot: ALWAYS occupies 1.125rem so every FormItem in the
        same grid row has identical total height regardless of whether error /
        helper props are wired up. Visibility is controlled by opacity alone
        (no DOM diff, no layout shift).
      */}
      <div class="h-[1.125rem] flex items-center overflow-hidden">
        <p
          class="flex items-center gap-1 text-xs leading-none transition-opacity duration-150"
          style={{
            opacity: showError() ? '1' : '0',
            color: showError() ? 'var(--c-input-error-text)' : 'var(--c-text-subtle)',
          }}
        >
          <Icon
            name="alert-circle"
            size={12}
            style={{ visibility: showError() ? 'visible' : 'hidden' }}
          />
          {message()}
        </p>
      </div>

    </div>
  )
}
