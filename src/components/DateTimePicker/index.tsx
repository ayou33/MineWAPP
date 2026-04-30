import { isPC } from '@/config'
import { popup } from '@/components/popups/Popups'
import DateTimePicker from './DateTimePicker'
import type { DateTimePickerMode, DateTimePickerProps } from './DateTimePicker'

export { default as DateTimePicker } from './DateTimePicker'
export type { DateTimePickerMode, DateTimePickerProps } from './DateTimePicker'

// ─────────────────────────────────────────────────────────────────────────────
// Popup wrapper component — positions picker as bottom-sheet on mobile
// ─────────────────────────────────────────────────────────────────────────────

type SheetProps = DateTimePickerProps & { close: (result?: Date) => void }

function DateTimePickerSheet (props: SheetProps) {
  return isPC
    ? (
      <DateTimePicker
        mode={props.mode}
        value={props.value}
        minYear={props.minYear}
        maxYear={props.maxYear}
        onConfirm={d => props.close(d)}
        onCancel={() => props.close()}
      />
    )
    : (
      // On mobile: anchor to bottom of the fixed overlay
      <div class="absolute bottom-0 left-0 right-0 w-full">
        <DateTimePicker
          mode={props.mode}
          value={props.value}
          minYear={props.minYear}
          maxYear={props.maxYear}
          onConfirm={d => props.close(d)}
          onCancel={() => props.close()}
        />
      </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export type ShowDateTimePickerOptions = {
  mode?: DateTimePickerMode
  value?: Date
  minYear?: number
  maxYear?: number
  /** Title shown in PCPopupShell (PC only) */
  title?: string
}

/**
 * Imperatively open a DateTimePicker as a popup.
 * Returns a promise that resolves to the selected Date, or undefined if cancelled.
 */
export function showDateTimePicker (options?: ShowDateTimePickerOptions): Promise<Date | undefined> & { cancel: () => void } {
  return popup<typeof DateTimePickerSheet, PropsOf<typeof DateTimePickerSheet>, Date>(
    DateTimePickerSheet,
    {
      title: options?.title ?? (
        options?.mode === 'date' ? '选择日期'
          : options?.mode === 'time' ? '选择时间'
            : '选择日期和时间'
      ),
      props: {
        mode:    options?.mode,
        value:   options?.value,
        minYear: options?.minYear,
        maxYear: options?.maxYear,
      },
    },
  ) as Promise<Date | undefined> & { cancel: () => void }
}
