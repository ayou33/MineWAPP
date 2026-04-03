/**
 * File: Loading.component.tsx of CE.Solid.Ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/5/29 16:08
 */
import Spin from '@/components/Spin'
import { Accessor, ParentProps, Show } from 'solid-js'

export default function ComponentLoading (props: ParentProps & { loading: Accessor<boolean> }) {
  return (
    <Show when={props.loading()} fallback={props.children}>
      <Spin class="border-green" />
    </Show>
  )
}
