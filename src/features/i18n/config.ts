/**
 * File: config.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/5/7 14:46
 */
import { ONE, ZERO } from '@/config'
import { defaultLang } from '@/config/langs'
import { TemplateResolver } from '@solid-primitives/i18n'
import * as R from 'ramda'

export const locales = [
  {
    code: 'en-US',
    name: 'English',
  },
  {
    code: 'zh-CN',
    name: '简体中文',
  },
  {
    code: 'zh-TW',
    name: '繁体中文',
  },
  // {
  //   code: 'ar-AE',
  //   name: 'عربي',
  // },
  {
    code: 'de-DE',
    name: 'Deutsch',
  },
  {
    code: 'fr-FR',
    name: 'Français',
  },
  {
    code: 'nl-NL',
    name: 'Nederlands',
  },
  {
    code: 'vi-VN',
    name: 'Tiếng Việt',
  },
  {
    code: 'no-NO',
    name: 'Norsk',
  },
  {
    code: 'fi-FI',
    name: 'Suomi',
  },
  {
    code: 'sv-SE',
    name: 'Svenska',
  },
  {
    code: 'da-DK',
    name: 'Dansk',
  },
  {
    code: 'it-IT',
    name: 'Italiano',
  },
  {
    code: 'es-ES',
    name: 'Español',
  },
  {
    code: 'th-TH',
    name: 'ภาษาไทย',
  },
  {
    code: 'ja-JP',
    name: '日本語',
  },
  {
    code: 'tr-TR',
    name: 'Türkçe',
  },
  {
    code: 'pt-PT',
    name: 'Português',
  }
] as const

export const defaultLocale = defaultLang

export const fallbackLocale = defaultLang

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
