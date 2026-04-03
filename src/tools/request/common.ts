/**
 * Common request parameters builder.
 * Extend this to add authentication tokens, device info, etc.
 */
import application from '@/app/application'

function device () {
  return {
    language: application.locale(),
    _t: Date.now(),
  }
}

function user () {
  const _user = application.user()
  if (_user) {
    return {
      userId: _user.userId,
      token: _user.token,
    }
  }

  return null
}

export function buildCommonParams () {
  return {
    ...device(),
    ...user(),
  }
}

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
