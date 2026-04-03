/**
 * File: model.ts of CE.Solid.Ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/6/11 17:44
 */
import { Accessor, createRenderEffect, onCleanup, Signal } from 'solid-js'

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      model: [() => any, (v: any) => any]
    }
  }
}

export default function model (el: HTMLInputElement, value: Accessor<Signal<string>>) {
  const [field, setField] = value()
  
  createRenderEffect(() => (el.value = field()))
  
  function onInput (e: Event) {
    setField((e.target as HTMLInputElement)?.value ?? '')
  }
  
  el.addEventListener('input', onInput)
  
  onCleanup(() => {
    el.removeEventListener('input', onInput)
  })
}
