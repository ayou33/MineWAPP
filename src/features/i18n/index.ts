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

/**
 * Loose translator shape used by `t` / `fallback`.
 * The primitive's generic path typing is too strict for runtime-flexible flat
 * dictionaries, so we narrow it at the boundary (the underlying behaviour is
 * unchanged — it is still the same `translator` call at runtime).
 */
type Translate = (path: string, mix?: Record<string, unknown> | string) => string | undefined

const loadedSource: Array<[SourceFn, string | undefined]> = []

const [dictionaries, setDictionaries] = createStore<{ [p in Locale]?: Dictionary }>({
  [fallbackLocale]: {},
})

const dict = createMemo<Dictionary>(() => dictionaries[application.locale() as Locale] ?? dictionaries[fallbackLocale] as Dictionary)

export function t (path: string, mix?: Record<string, unknown> | string, dftTxt?: string) {
  const translate = translator(dict, templateResolver) as unknown as Translate
  return translate(path, mix) ?? ('string' === typeof mix ? mix : (dftTxt ?? path))
}

export function fallback (path: string, args: Record<string, unknown>) {
  const translate = translator(() => dictionaries[fallbackLocale], templateResolver) as unknown as Translate
  return translate(path, args)
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
  let resp: Data<string | number> | undefined

  try {
    resp = await requestLanguage(source(lang))
  } catch {
    // Never fall back recursively: if the fallback locale itself fails to load,
    // give up and keep whatever dictionary is already registered.
    if (lang === fallbackLocale) {
      console.warn(`[i18n] Failed to load fallback locale "${lang}"`)
      return
    }
    // Switch the whole app to the fallback locale. setLocale() re-loads all
    // registered sources for the fallback, so there is no double fetch here.
    await setLocale(fallbackLocale)
    return
  }

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
    // The scope is a free-form runtime string; keep the strict typing out of the
    // call and cast the result to the declared return type.
    const base = translator(dict, templateResolver) as unknown as (path: string, mix?: unknown) => string
    return scopedTranslator(base as never, moduleOrFn as never) as unknown as Translator<Dictionary, string>
  }
  
  return translator(dict, templateResolver) as unknown as Translator<Dictionary, string>
}
