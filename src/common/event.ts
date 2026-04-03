/**
 * File: event.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/4/29 13:40
 */
import { useEvent } from 'lunzi'

const event = useEvent()

export const on = event.on

export const off = event.off

export const emit = event.emit

export const once = event.once

export function defaultEvent (event: string) {
  return `${event}.default`
}
