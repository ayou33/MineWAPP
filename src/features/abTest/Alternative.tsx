/**
 * File: Alternative.tsx of CE_Solid_TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/7/6 19:48
 */
import {
  Accessor,
  Component,
  createEffect,
  createMemo,
  createSignal,
  ParentProps,
  splitProps,
  ValidComponent,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

export default function Alternative (props: {
  load: () => Promise<{
    default: Component<ParentProps<any>>;
    fallback?: Component<ParentProps<any>>;
  }>;
  by: Accessor<boolean>;
  static?: boolean;
  [key: string]: unknown;
}) {
  const [local, rest] = splitProps(props, ['load', 'by', 'static'])
  const [Component, setComponent] = createSignal<ValidComponent | undefined>()
  
  local
    .load()
    .then(components => {
      if (local.static) {
        setComponent(() => local.by() ? components.default : components.fallback)
      } else {
        createEffect(() => {
          setComponent(createMemo(() => local.by() ? components.default : components.fallback))
        })
      }
    })
  
  return (
    <Dynamic component={Component()} {...rest} />
  )
}
