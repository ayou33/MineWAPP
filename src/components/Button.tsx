/**
 * File: Button.tsx of CE.Solid.Ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/6/7 17:33
 */
import Spin from '@/components/Spin'
import useTimer from '@/hooks/useTimer'
import Touchable from '@/provider/Touchable'
import classNames from 'classnames'
import { Accessor, createEffect, createSignal, ParentProps, Show, splitProps } from 'solid-js'

type ButtonProps = Partial<{
  class: string;
  spinClass: string;
  style: Data<string | number>;
  loading: Accessor<boolean>;
  disabled: boolean;
  onClick: (e: MouseEvent) => void;
}> & ParentProps

const MIN_LOADING_TIME = 500

export default function Button (props: ButtonProps) {
  const [local, others] = splitProps(props, [
    'children', 'class', 'spinClass', 'loading', 'onClick'
  ])
  const [loading, setLoading] = createSignal(false)
  const { delay } = useTimer()
  
  createEffect(() => {
    setLoading(local.loading?.() ?? false)
  })
  
  async function onClick (e: MouseEvent) {
    if (loading()) return
    
    const start = Date.now()

    setLoading(true)

    try {
      await local.onClick?.(e)
    } finally {
      const estimated = Date.now() - start
      if (estimated < MIN_LOADING_TIME) {
        delay(() => {
          setLoading(false)
        }, MIN_LOADING_TIME - estimated)
      } else {
        setLoading(false)
      }
    }
  }
  
  return (
    <Touchable.button
      class={classNames(local.class)}
      onTap={onClick}
      {...others}
    >
      <Show when={loading() ?? false} fallback={local.children}><Spin class={classNames(local.spinClass ?? 'border-white')} /></Show>
    </Touchable.button>
  )
}
