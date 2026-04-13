/**
 * Pure request utilities — not project-specific.
 * For customisable request params see request.config.ts → buildCommonParams.
 */

export function makeFormData (obj: Data) {
  const formData = new FormData()
  const { file, files, ...rest } = obj

  for (const key in rest) {
    formData.append(key, obj[key] as string)
  }

  if (files) {
    formData.append('files', files as string)
  }

  if (file) {
    formData.append('file', file as string)
  }

  return formData
}
