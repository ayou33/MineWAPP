/**
 * File: index.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/4/25 17:18
 */
import { ONE_DAY, ONE_HOUR, ONE_MINUTE, ONE_SECOND, ZERO } from '@/config'
import BitCount from 'lunzi/src/BitCount'
import * as R from 'ramda'

export const uuidV4 = (prefix = '') => {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'))
  return prefix + [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10).join(''),
  ].join('-')
}

export const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min)

export function randomStr (length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function counter (max: number, done: VoidFn) {
  let count = max
  
  return function () {
    if (--count <= 0) {
      done()
    }
  }
}

export function searchParam (name: string, url?: string | null) {
  return new URLSearchParams(url ?? window.location.search).get(name)
}

export function parseOrReturn<T> (origin?: T) {
  try {
    return JSON.parse(origin as string)
  } catch {
    return origin
  }
}

export function charCodesToString (charCodes: number[]) {
  return String.fromCharCode.apply(null, charCodes)
}

export function base64ToFile (base64: string, filename: string) {
  const arr = base64.split(',')
  const mime = arr[0]?.match(/:(.*?);/)?.[1] ?? ''
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  
  return new File([u8arr], filename, { type: mime })
}

export function delay (ms: number): Promise<void>
export function delay (ms: number, cb: VoidFn): ReturnType<typeof setTimeout>
export function delay (ms: number, cb?: VoidFn) {
  if (cb) {
    return setTimeout(cb, Math.max(ms, ZERO))
  }
  return new Promise<void>(resolve => setTimeout(resolve, Math.max(ms, ZERO)))
}

export function nextLoop (): Promise<void>
export function nextLoop (cb: VoidFn): ReturnType<typeof setTimeout>
export function nextLoop (cb?: VoidFn) {
  return cb ? delay(ZERO, cb) : delay(ZERO)
}

export function removeChild (node: Element) {
  if (node && node.parentNode) {
    node.parentNode.removeChild(node)
  }
}

export const ellipsisAfter = R.curry((n: number, x: string) => x.length > n ? `${x.slice(0, n)}...` : x)

export function leftTime (duration: number) {
  const days = Math.floor(duration / ONE_DAY)
  const remainAfterDays = duration % ONE_DAY
  const hours = Math.floor(remainAfterDays / ONE_HOUR)
  const remainAfterHours = remainAfterDays % ONE_HOUR
  const minutes = Math.floor(remainAfterHours / ONE_MINUTE)
  const remainAfterMinutes = remainAfterHours % ONE_MINUTE
  const seconds = Math.floor(remainAfterMinutes / ONE_SECOND)
  return { days, hours, minutes, seconds }
}

export function padTime (number?: number, chars = 2) {
  return number?.toString().padStart(chars, '0') ?? '0000000000'.slice(-chars)
}

export function digitalTime (duration: number) {
  const left = leftTime(duration)
  return `${padTime(left.hours)}:${padTime(left.minutes)}:${padTime(left.seconds)}`
}

export function countLeftTime (duration: number, timeout?: VoidFn, autoPrune = false) {
  const left = leftTime(duration)
  const hours = new BitCount(left.hours + left.days * 24, null, { radix: 24 })
  const minutes = new BitCount(left.minutes, hours, { radix: 60 })
  return new BitCount(left.seconds, minutes, { autoPrune, radix: 60, onComplete: timeout })
}

export function countLeftHour (duration: number, timeout?: VoidFn) {
  const left = leftTime(duration)
  const hours = new BitCount(left.hours + left.days * 24, null, { radix: 1000 })
  const minutes = new BitCount(left.minutes, hours, { radix: 60 })
  return new BitCount(left.seconds, minutes, { radix: 60, onComplete: timeout })
}

export function groupNumber (number: number) {
  return number.toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,')
}

export function shortNumber (number: number, from = 1000) {
  if (number < from) {
    return number
  }

  return `${Math.floor(number / from)}k`
}

export const min0 = R.unapply(R.pipe(R.append(0), R.apply(Math.max)))
