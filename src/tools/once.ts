/**
 * File: once.ts of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/8/2 22:23
 */
import { logFor } from '@/common/log'
import * as R from 'ramda'
import { Accessor, createReaction, untrack } from 'solid-js'

const log = logFor('onValued')

export default function once <T = unknown, V extends T = T extends undefined ? never : T extends null ? never : T> (
  onValued: (value: V) => void,
  value: Accessor<T>,
  ifValued: (v: T) => boolean = (value: T) => R.isNotNil(value)
) {
  function trackValue () {
    const track = createReaction(() => {
      const v = untrack(value)
      
      if (ifValued(v)) {
        log('target is valued, callback')
        onValued(v as V)
      } else {
        log('target is not valued, track again')
        trackValue()
      }
    })
    
    if (ifValued(untrack(value))) {
      log('initial value is satisfied, callback')
      onValued(untrack(value) as V)
    } else {
      track(() => value())
    }
  }
  
  trackValue()
  
  return trackValue
}
