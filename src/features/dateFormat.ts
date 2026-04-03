/**
 * File: dateFormat.ts of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/7/26 15:44
 */
import { ZERO } from '@/config'

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const formatters = {
  // year
  y (this: Date, pattern: string) {
    return this.getFullYear().toString().slice(-pattern.length)
  },
  // // quarter
  q (this: Date) {
    return Math.floor((this.getMonth() + 3) / 3).toString()
  },
  // // month
  m (this: Date, pattern: string) {
    if (pattern.length > 2) {
      return months[this.getMonth()]
    }
    
    return (this.getMonth() + 1).toString().padStart(pattern.length, '0')
  },
  // weekday
  w (this: Date) {
    return weekdays[this.getDay()]
  },
  // // day
  d (this: Date, pattern: string) {
    return this.getDate().toString().padStart(pattern.length, '0')
  },
  // // hour
  H (this: Date, pattern: string) {
    return this.getHours().toString().padStart(pattern.length, '0')
  },
  // // minute
  M (this: Date, pattern: string) {
    return this.getMinutes().toString().padStart(pattern.length, '0')
  },
  // // second
  S (this: Date, pattern: string) {
    return this.getSeconds().toString().padStart(pattern.length, '0')
  },
  // // millisecond
  X (this: Date, pattern: string) {
    return this.getMilliseconds().toString().padStart(pattern.length, '0')
  },
}

type Char = keyof typeof formatters

const patternChars = Object.keys(formatters).join('')

Date.prototype.format2 = function (pattern: string) {
  let target = pattern
  
  const patterns = pattern.split(new RegExp(`[^${patternChars}]`)).filter(Boolean)
  
  patterns.map(p => {
    const char = p.charAt(ZERO)
    if (char in formatters) {
      target = target.replace(p, formatters[char as Char].call(this, p))
    }
  })
  
  return target
}
