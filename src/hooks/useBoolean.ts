/**
 * File: useBoolean.ts of CE.Solid.Ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/6/12 15:04
 */
import { createEffect, createSignal } from 'solid-js'

export default function useBoolean (dftState = false, onStateChange?: (value: boolean) => void) {
  const [state, setState] = createSignal(dftState)
  const setTrue = () => setState(true)
  const setFalse = () => setState(false)
  const toggle = () => setState((prev) => !prev)
  const set = (value: boolean) => setState(value)
  
  createEffect(() => onStateChange?.(state()))
  
  return [state, { setTrue, setFalse, toggle, set }] as const
}
