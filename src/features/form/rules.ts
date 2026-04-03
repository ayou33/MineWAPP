import type { Rule } from './types'

/** Field must not be null, undefined, empty string, or empty array */
export function required (message = 'This field is required'): Rule {
  return (value) => {
    if (value === null || value === undefined || value === '') return message
    if (Array.isArray(value) && value.length === 0) return message
    return true
  }
}

/** String must have at least `len` characters */
export function minLength (len: number, message?: string): Rule<string> {
  return (value) => {
    if (typeof value === 'string' && value.length < len) {
      return message ?? `At least ${len} characters`
    }
    return true
  }
}

/** String must have at most `len` characters */
export function maxLength (len: number, message?: string): Rule<string> {
  return (value) => {
    if (typeof value === 'string' && value.length > len) {
      return message ?? `At most ${len} characters`
    }
    return true
  }
}

/** Number must be >= `threshold` */
export function min (threshold: number, message?: string): Rule<number> {
  return (value) => {
    if (typeof value === 'number' && value < threshold) {
      return message ?? `Minimum value is ${threshold}`
    }
    return true
  }
}

/** Number must be <= `threshold` */
export function max (threshold: number, message?: string): Rule<number> {
  return (value) => {
    if (typeof value === 'number' && value > threshold) {
      return message ?? `Maximum value is ${threshold}`
    }
    return true
  }
}

/** String must match `regex` */
export function pattern (regex: RegExp, message = 'Invalid format'): Rule<string> {
  return (value) => {
    if (typeof value === 'string' && !regex.test(value)) return message
    return true
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** String must be a valid email */
export function email (message = 'Invalid email address'): Rule<string> {
  return pattern(EMAIL_RE, message)
}

/** Value must equal the value of another field */
export function match (field: string, message?: string): Rule {
  return (value, values) => {
    if (value !== values[field]) {
      return message ?? `Must match ${field}`
    }
    return true
  }
}

/** Value must be one of the given options */
export function oneOf<V> (options: readonly V[], message?: string): Rule<V> {
  return (value) => {
    if (!options.includes(value)) {
      return message ?? `Must be one of: ${options.join(', ')}`
    }
    return true
  }
}

/** Custom validation — return `true` for valid, `false` or a string for invalid */
export function custom<V = unknown> (
  fn: (value: V, values: Readonly<Record<string, unknown>>) => boolean | string | Promise<boolean | string>,
  message = 'Validation failed',
): Rule<V> {
  return (value, values) => {
    const result = fn(value, values)

    function resolve (r: boolean | string): true | string {
      if (r === true) return true
      return typeof r === 'string' ? r : message
    }

    if (result instanceof Promise) {
      return result.then(resolve)
    }
    return resolve(result)
  }
}
