import { ZERO } from './numbers'

// ─── Supported locales ────────────────────────────────────────────────────────
// Add or remove BCP-47 language tags to match the locales your project supports.
// The first matching system language is used as the initial locale.
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
] as const

export const defaultLocale = 'en-US'

export function readSystemLang () {
  const incorporate: Data = {}
  locales.map(item => {
    if (!item) return
    incorporate[item.code.split('-')[ZERO]] = item.code
  })

  const systemLng = navigator.language
  const area = systemLng.split('-')[ZERO]
  if (Object.keys(incorporate).includes(area)) {
    if (area === 'zh') {
      return systemLng
    }
    return incorporate[area]
  }

  return ''
}
