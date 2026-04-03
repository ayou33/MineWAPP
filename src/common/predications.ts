/**
 * File: predications.ts of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/7/22 15:35
 */
import { ZERO } from '@/config/numbers'
import * as R from 'ramda'

export function isGT0 (num: unknown, ctor: AnyFn = Number): boolean {
  return ctor(num) > ZERO
}

export function isLT0 (num: unknown, ctor: AnyFn = Number): boolean {
  return ctor(num) < ZERO
}

export function isZero (num?: number) {
  return num === ZERO
}

export const default0 = R.defaultTo(ZERO)

export function useArray <T> (action: (array: T[]) => unknown) {
  return (a: T[] | undefined) => action(a ?? [])
}

export function isNumber (num: unknown): boolean {
  return typeof num === 'number' && num === num
}
