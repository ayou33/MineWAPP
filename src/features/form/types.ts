/** Validation result: `true` = pass, `string` = error message */
export type ValidateResult = true | string

/** A validation rule: returns `true` when valid, or an error message string */
export type Rule<V = unknown> = (
  value: V,
  values: Readonly<Record<string, unknown>>,
) => ValidateResult | Promise<ValidateResult>

/** When to auto-validate fields */
export type ValidateOn = 'change' | 'blur' | 'submit'

/** Context passed to cascade handlers */
export type CascadeContext<T extends Record<string, any>> = {
  setValue: <K extends keyof T & string>(field: K, value: T[K]) => void
  resetField: <K extends keyof T & string>(field: K) => void
  values: Readonly<T>
}

/** Relation definition: auto-compute a field value when deps change */
export type Relation<T extends Record<string, any>, K extends keyof T = keyof T> = {
  deps: (keyof T & string)[]
  compute: (values: Readonly<T>) => T[K]
}

/** Per-field metadata */
export type FieldMeta = {
  error: string | null
  touched: boolean
  validating: boolean
}

/** Form configuration */
export type FormConfig<T extends Record<string, any>> = {
  initialValues: T
  rules?: Partial<{ [K in keyof T & string]: Rule<T[K]> | Rule<T[K]>[] }>
  cascade?: Partial<{ [K in keyof T & string]: (value: T[K], ctx: CascadeContext<T>) => void }>
  relations?: Partial<{ [K in keyof T & string]: Relation<T, K> }>
  validateOn?: ValidateOn
}
