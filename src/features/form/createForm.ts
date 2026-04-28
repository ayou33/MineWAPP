import { batch, createEffect, createMemo, createSignal, on } from 'solid-js'
import { createStore, produce, reconcile } from 'solid-js/store'
import type { CascadeContext, FieldMeta, FormConfig, Rule } from './types'

export default function createForm<T extends Record<string, any>> (config: FormConfig<T>) {
  const {
    initialValues,
    rules = {} as NonNullable<FormConfig<T>['rules']>,
    cascade = {} as NonNullable<FormConfig<T>['cascade']>,
    relations = {} as NonNullable<FormConfig<T>['relations']>,
    validateOn = 'blur',
  } = config

  const fieldNames = Object.keys(initialValues) as (keyof T & string)[]

  /* ── reactive stores ── */
  const [values, setValues] = createStore<T>({ ...initialValues } as T)

  const initMeta: Record<string, FieldMeta> = {}
  for (const key of fieldNames) {
    initMeta[key] = { error: null, touched: false, validating: false }
  }
  const [meta, setMeta] = createStore(initMeta)

  const [submitting, setSubmitting] = createSignal(false)

  /* ── cascade loop guard ── */
  const cascadeStack = new Set<string>()

  /* ── cascade context (passed to cascade handlers) ── */
  const cascadeCtx: CascadeContext<T> = {
    setValue<K extends keyof T & string> (field: K, value: T[K]) { setValue(field, value) },
    resetField<K extends keyof T & string> (field: K) { resetField(field) },
    get values () { return values as Readonly<T> },
  }

  /* ── setValue ── */
  function setValue<K extends keyof T & string> (field: K, value: T[K]) {
    setValues(produce((draft: T) => { draft[field] = value }))

    if (validateOn === 'change') {
      validateField(field)
    }

    // trigger cascade (with loop protection)
    const handler = (cascade as Record<string, AnyFn | undefined>)[field]
    if (handler && !cascadeStack.has(field)) {
      cascadeStack.add(field)
      try {
        handler(value, cascadeCtx)
      } finally {
        cascadeStack.delete(field)
      }
    }
  }

  /* ── setTouched ── */
  function setTouched<K extends keyof T & string> (field: K) {
    setMeta(field, 'touched', true)
    if (validateOn === 'blur') {
      validateField(field)
    }
  }

  /* ── setError (manual) ── */
  function setError<K extends keyof T & string> (field: K, error: string | null) {
    setMeta(field, 'error', error)
  }

  /* ── field validation ── */
  async function validateField<K extends keyof T & string> (field: K): Promise<boolean> {
    const raw = (rules as Record<string, Rule | Rule[] | undefined>)[field]
    const fieldRules = Array.isArray(raw) ? raw : (raw ? [raw] : [])
    if (!fieldRules.length) {
      setMeta(field, 'error', null)
      return true
    }

    setMeta(field, 'validating', true)
    try {
      for (const rule of fieldRules) {
        const result = rule(values[field], values as Record<string, unknown>)
        const resolved = result instanceof Promise ? await result : result
        if (typeof resolved === 'string') {
          setMeta(field, 'error', resolved)
          return false
        }
      }
      setMeta(field, 'error', null)
      return true
    } finally {
      setMeta(field, 'validating', false)
    }
  }

  /* ── validate all ── */
  async function validate (): Promise<boolean> {
    const results = await Promise.all(fieldNames.map(f => validateField(f)))
    return results.every(Boolean)
  }

  /* ── reset ── */
  function reset () {
    batch(() => {
      setValues(reconcile({ ...initialValues } as T))
      for (const key of fieldNames) {
        setMeta(key, { error: null, touched: false, validating: false })
      }
    })
  }

  function resetField<K extends keyof T & string> (field: K) {
    batch(() => {
      setValues(produce((draft: T) => { draft[field] = initialValues[field] }))
      setMeta(field, { error: null, touched: false, validating: false })
    })
  }

  /* ── submit ── */
  async function submit (handler: (values: Readonly<T>) => void | Promise<void>): Promise<boolean> {
    batch(() => {
      for (const key of fieldNames) {
        setMeta(key, 'touched', true)
      }
    })

    const valid = await validate()
    if (!valid) return false

    setSubmitting(true)
    try {
      await handler(values as T)
      return true
    } finally {
      setSubmitting(false)
    }
  }

  /* ── relation effects ── */
  for (const field of fieldNames) {
    const relation = (relations as Record<string, { deps: string[]; compute: (v: Readonly<T>) => T[keyof T] } | undefined>)[field]
    if (!relation) continue

    const { deps, compute } = relation
    createEffect(on(
      () => deps.map(d => values[d as keyof T]),
      () => {
        const computed = compute(values as Readonly<T>)
        setValues(produce((draft: T) => { draft[field] = computed as T[keyof T & string] }))
      },
      { defer: true },
    ))
  }

  /* ── computed ── */
  const isValid = createMemo(() => fieldNames.every(f => !meta[f]?.error))
  const isDirty = createMemo(() => fieldNames.some(f => values[f] !== initialValues[f]))

  /* ── bind helpers ── */
  function bind<K extends keyof T & string> (field: K) {
    return {
      get value () { return values[field] as string },
      onInput (e: InputEvent) { setValue(field, (e.currentTarget as HTMLInputElement).value as T[K]) },
      onBlur () { setTouched(field) },
    }
  }

  function bindNumber<K extends keyof T & string> (field: K) {
    return {
      get value () { return String(values[field] ?? '') },
      onInput (e: InputEvent) {
        const raw = (e.currentTarget as HTMLInputElement).value
        setValue(field, (raw === '' ? 0 : Number(raw)) as T[K])
      },
      onBlur () { setTouched(field) },
    }
  }

  function bindCheckbox<K extends keyof T & string> (field: K) {
    return {
      get checked () { return Boolean(values[field]) },
      onChange (e: Event) { setValue(field, (e.currentTarget as HTMLInputElement).checked as T[K]) },
    }
  }

  function bindSelect<K extends keyof T & string> (field: K) {
    return {
      get value () { return String(values[field] ?? '') },
      onChange (e: Event) { setValue(field, (e.currentTarget as HTMLSelectElement).value as T[K]) },
      onBlur () { setTouched(field) },
    }
  }

  /* ── public API ── */
  return {
    // reactive store
    values: values as Readonly<T>,

    // per-field accessors
    value:      <K extends keyof T & string>(field: K) => values[field],
    error:      (field: keyof T & string) => meta[field]?.error ?? null,
    touched:    (field: keyof T & string) => meta[field]?.touched ?? false,
    dirty:      (field: keyof T & string) => values[field] !== initialValues[field],
    validating: (field: keyof T & string) => meta[field]?.validating ?? false,

    // mutations
    setValue,
    setTouched,
    setError,

    // validation
    validate,
    validateField,

    // lifecycle
    reset,
    resetField,
    submit,

    // input binding helpers
    bind,
    bindNumber,
    bindCheckbox,
    bindSelect,

    // form-level computed (call as accessors, e.g. `form.isValid()`)
    isValid,
    isDirty,
    isSubmitting: submitting,
  }
}
