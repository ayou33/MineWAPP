/**
 * File: log.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/4/30 10:22
 */
import { log } from 'lunzi'

if (import.meta.env.PROD) {
  log.off()
}

export function logFor (badge: string) {
  return log.create(badge, 'background: linear-gradient(to right, #8b5cf6, #d946ef); color: white; padding: 0 2px; border-radius: 2px;')
}
