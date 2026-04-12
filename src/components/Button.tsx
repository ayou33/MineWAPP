/**
 * File: Button.tsx of CE.Solid.Ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/6/7 17:33
 */
import Spin from '@/components/Spin'
import useTimer from '@/hooks/useTimer'
import Touchable from '@/provider/Touchable'
import classNames from 'classnames'
import { Accessor, createEffect, createSignal, For, ParentProps, Show, splitProps } from 'solid-js'

type ButtonProps = Partial<{
  class: string;
  spinClass: string;
  style: Data<string | number>;
  loading: Accessor<boolean>;
  disabled: boolean;
  onClick: (e: MouseEvent) => void;
}> & ParentProps

type Ripple = {
  id: number;
  x: number;
  y: number;
  size: number;
}

const MIN_LOADING_TIME = 500

export default function Button (props: ButtonProps) {
  const [local, others] = splitProps(props, [
    'children', 'class', 'spinClass', 'loading', 'onClick'
  ])
  const [loading, setLoading] = createSignal(false)
  const [ripples, setRipples] = createSignal<Ripple[]>([])
  const { delay } = useTimer()

  createEffect(() => {
    setLoading(local.loading?.() ?? false)
  })

  function triggerRipple (e: MouseEvent) {
    const btn = e.currentTarget as HTMLElement
    const rect = btn.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const W = rect.width
    const H = rect.height
    // size must reach the farthest corner from the click point
    const size = 2 * Math.max(
      Math.hypot(x, y),
      Math.hypot(W - x, y),
      Math.hypot(x, H - y),
      Math.hypot(W - x, H - y),
    )
    const id = Date.now() + Math.random()
    setRipples(r => [...r, { id, x, y, size }])
    // remove after animation ends (600ms) + buffer
    setTimeout(() => setRipples(r => r.filter(ri => ri.id !== id)), 650)
  }

  async function onClick (e: MouseEvent) {
    if (loading()) return
    triggerRipple(e)
    const start = Date.now()
    setLoading(true)
    try {
      await local.onClick?.(e)
    } finally {
      const estimated = Date.now() - start
      if (estimated < MIN_LOADING_TIME) {
        delay(() => setLoading(false), MIN_LOADING_TIME - estimated)
      } else {
        setLoading(false)
      }
    }
  }

  return (
    <Touchable.button
      class={classNames('relative overflow-hidden', local.class)}
      onTap={onClick}
      {...others}
    >
      <Show when={loading() ?? false} fallback={local.children}>
        <Spin class={classNames(local.spinClass ?? 'border-white')} />
      </Show>
      <For each={ripples()}>
        {(r) => (
          <span
            class="ripple-effect"
            style={{
              width: `${r.size}px`,
              height: `${r.size}px`,
              left: `${r.x - r.size / 2}px`,
              top: `${r.y - r.size / 2}px`,
            }}
          />
        )}
      </For>
    </Touchable.button>
  )
}
