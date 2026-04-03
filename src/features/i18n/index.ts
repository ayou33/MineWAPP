/**
 * File: i18n.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/5/7 18:08
 */
import { LOCAL_USER_KEYS, ONE_HOUR } from '@/config'
import { Dictionary, fallbackLocale, Locale, templateResolver } from '@/features/i18n/config'
import application from '@/app/application'
import { ApiPath, get } from '@/tools/request'
import { flatten, scopedTranslator, translator, Translator } from '@solid-primitives/i18n'
import { localSet } from 'lunzi'
import { createMemo, untrack } from 'solid-js'
import { createStore } from 'solid-js/store'

type SourceFn = (local: Locale) => ApiPath

const loadedSource: Array<[SourceFn, string | undefined]> = []

const [dictionaries, setDictionaries] = createStore<{ [p in Locale]?: Dictionary }>({
  [fallbackLocale]: {},
})

const dict = createMemo<Dictionary>(() => dictionaries[application.locale() as Locale] ?? dictionaries[fallbackLocale] as Dictionary)

export function t (path: string, mix?: Record<string, unknown> | string, dftTxt?: string) {
  return translator(dict, templateResolver)(path, mix) ?? ('string' === typeof mix ? mix : (dftTxt ?? path))
}

export function fallback (path: string, args: Record<string, unknown>) {
  return translator(() => dictionaries[fallbackLocale], templateResolver)(path, args)
}

export function te (path: string): boolean {
  return path in dict()
}

export function setLocale (locale: Locale) {
  localSet(LOCAL_USER_KEYS.LOCALE, locale)
  application.setLocale(locale)
  
  return Promise.all(loadedSource.map(([source, mix]) => loadLanguage(source, locale, mix)))
}

function requestLanguage (path: ApiPath) {
  return get<Data<string | number>>(path, {
    expireIn: ONE_HOUR, // 1 hour
    baseURL: '',
  })()
}

async function loadLanguage (source: SourceFn, lang: Locale, mix?: string | (() => void)) {
  let resp = await requestLanguage(source(lang))
    .catch(async () => {
      setLocale('en-US')
      resp = await requestLanguage(source('en-US'))
    })
  
  setDictionaries(lang, prev => flatten({
    ...prev,
    ...('string' === typeof mix ? { [mix]: resp } : resp),
  }))
  
  if ('function' === typeof mix) mix()
}

export function loadLang (source: SourceFn, moduleOrFn?: string | (() => void)): Translator<Dictionary, string> {
  const lang = untrack(application.locale) as Locale
  
  loadedSource.push([source, typeof moduleOrFn === 'string' ? moduleOrFn : undefined])
  
  loadLanguage(source, lang, moduleOrFn)
  
  if ('string' === typeof moduleOrFn) {
    return scopedTranslator(translator(dict, templateResolver), moduleOrFn) as unknown as Translator<Dictionary, string>
  }
  
  return translator(dict, templateResolver)
}
