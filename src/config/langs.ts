import { ZERO } from './numbers'

// ─── Supported locales ────────────────────────────────────────────────────────
// Add or remove BCP-47 language tags to match the locales your project supports.
// The first matching system language is used as the initial locale.
const langs = ['en-US', 'zh-CN', 'zh-TW', 'ja-JP', 'ko-KR', 'es-ES', 'fr-FR', 'de-DE', 'pt-PT', 'it-IT']

export default langs

// The fallback locale used when no system language matches any entry in `langs`.
export const defaultLang = 'en-US'

export function readSystemLang () {
  const incorporate: Data = {}
  langs.map(item => {
    if (!item) return
    incorporate[item.split('-')[ZERO]] = item
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
