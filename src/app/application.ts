/**
 * Lightweight application state singleton.
 * Manages locale, auth state, and user info.
 * Extend this module to add app-level concerns.
 */
import { LOCAL_USER_KEYS, USER_ROLE } from '@/config'
import { defaultLang, readSystemLang } from '@/config/langs'
import { localGet, localSet } from 'lunzi'
import { createSignal } from 'solid-js'

export type AppUser = {
  group: number
  userId: string | number
  token: string
  [key: string]: unknown
}

const savedLocale = localGet(LOCAL_USER_KEYS.LOCALE) || readSystemLang() || defaultLang
const [locale, setLocale] = createSignal(savedLocale)

const savedUser = localGet(LOCAL_USER_KEYS.USER) as AppUser | null
const [user, setUser] = createSignal<AppUser | null>(savedUser)

function role () {
  return user() ? USER_ROLE.USER : USER_ROLE.PASSENGER
}

function login (userData: AppUser) {
  localSet(LOCAL_USER_KEYS.USER, userData)
  setUser(userData)
}

function logout () {
  localSet(LOCAL_USER_KEYS.USER, null)
  setUser(null)
}

function updateLocale (lang: string) {
  localSet(LOCAL_USER_KEYS.LOCALE, lang)
  setLocale(lang)
}

async function ready () {
  return !!user()
}

const application = {
  userGroup: () => user()?.group,
  locale,
  setLocale: updateLocale,
  user,
  role,
  login,
  logout,
  ready,
}

export default application
