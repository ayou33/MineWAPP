/**
 * File: config.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/5/7 14:46
 */
import { ONE, ZERO } from '@/config'
import { defaultLocale, locales } from '@/config/locale'
import { TemplateResolver } from '@solid-primitives/i18n'
import * as R from 'ramda'

export const fallbackLocale = defaultLocale

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Dictionary<T = any> = Record<string | number, T>

export type Locale = typeof locales[number]['code']

const TEMPLATE_VAR_START = '{{'

const TEMPLATE_VAR_END = '}}'

const varReg = (name: string) => new RegExp(`${TEMPLATE_VAR_START}\\s*${name}\\s*${TEMPLATE_VAR_END}`, 'g')

function defaultResolver (string: string, args?: Record<string, unknown>) {
  if (!args) return string
  
  for (const [key, value] of Object.entries(args))
    string = string.replace(varReg(key), value as string)
  
  return string
}

function useColors (colors: string[] = []) {
  const usedColors = colors
  let i = 0
  
  return () => {
    if (!usedColors[i]) {
      usedColors[i] = usedColors[Math.max(ZERO, i - ONE)] ?? '#F64D4B'
    }
    
    return usedColors[i++]
  }
}

function otherResolver (string: string, args?: Record<string, unknown>) {
  if (!args?.colorful) return string
  
  const useColor = useColors(Array.isArray(args.colorful) ? args.colorful : [])
  
  return string.replace(/<\d>([^</]*)<\/\d>/g, (_, group) => {
    return `<span style="color: ${useColor()}">${group}</span>`
  })
}

const resolvers: TemplateResolver<string>[] = [
  defaultResolver,
  otherResolver,
]

export const templateResolver: TemplateResolver<string> = (...args: Parameters<TemplateResolver<string>>) => {
  const [template, values] = args
  
  return R.reduce((acc, resolve) => resolve(acc, values), template, resolvers)
}
