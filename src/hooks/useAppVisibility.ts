/**
 * File: useAppVisibility.ts of CE.Solid.Ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/5/30 16:36
 */
import { onCleanup } from 'solid-js'

export default function useAppVisibilityState (onVisible?: VoidFn, onHidden?: VoidFn) {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      onVisible?.()
    } else {
      onHidden?.()
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  onCleanup(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })
  
  return document.visibilityState
}
