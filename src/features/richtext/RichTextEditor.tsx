import { createEffect, onCleanup, onMount } from 'solid-js'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import './richtext.css'

type Props = {
  /** HTML string value (controlled) */
  value: string
  /** Called with updated HTML whenever the user edits content */
  onChange: (html: string) => void
  placeholder?: string
  /** Read-only when true */
  disabled?: boolean
  /** CSS min-height for the editable area. Default: 160px */
  minHeight?: string
  /** Activates the error border style */
  error?: boolean | string
}

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link'],
  ['clean'],
]

/** Normalise Quill's empty-state HTML to an empty string */
function normalize (html: string): string {
  return html === '<p><br></p>' ? '' : html
}

/**
 * RichTextEditor — a Quill 2 based rich-text input that integrates with
 * the project's MD3 design tokens and createForm engine.
 *
 * Usage:
 * ```tsx
 * <RichTextEditor
 *   value={form.value('content') as string}
 *   onChange={(v) => form.setValue('content', v)}
 *   placeholder="请输入公告正文..."
 *   minHeight="200px"
 * />
 * ```
 */
export default function RichTextEditor (props: Props) {
  let editorEl: HTMLDivElement | undefined
  let quill: Quill | undefined
  // Flag to prevent onChange → value → effect → dangerouslyPasteHTML loop
  let userEditing = false

  onMount(() => {
    quill = new Quill(editorEl!, {
      theme: 'snow',
      placeholder: props.placeholder ?? '请输入内容...',
      readOnly: props.disabled ?? false,
      modules: { toolbar: TOOLBAR_OPTIONS },
    })

    // Set initial HTML value
    if (props.value) {
      quill.clipboard.dangerouslyPasteHTML(props.value)
    }

    quill.on('text-change', () => {
      userEditing = true
      props.onChange(normalize(quill!.root.innerHTML))
      userEditing = false
    })
  })

  // Sync external value changes (e.g. form reset) into the editor
  createEffect(() => {
    const incoming = props.value ?? ''
    if (!userEditing && quill) {
      const current = normalize(quill.root.innerHTML)
      if (current !== incoming) {
        quill.clipboard.dangerouslyPasteHTML(incoming)
      }
    }
  })

  // Sync disabled prop
  createEffect(() => {
    quill?.enable(!props.disabled)
  })

  onCleanup(() => {
    quill?.off('text-change')
    quill = undefined
  })

  return (
    <div
      class={[
        'richtext-editor',
        props.disabled ? 'rte-disabled' : '',
        props.error ? 'rte-error' : '',
      ].filter(Boolean).join(' ')}
      style={props.minHeight ? { '--rte-min-height': props.minHeight } : {}}
    >
      <div ref={el => { editorEl = el }} />
    </div>
  )
}
