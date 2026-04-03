/**
 * File: Scroller.tsx of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/7/2 15:25
 */
import { uuidV4 } from '@/common'
import Spin from '@/components/Spin'
import { ZERO } from '@/config'
import { useActivated } from '@/features/keepAlive/hooks'
import classNames from 'classnames'
import throttle from 'lodash.throttle'
import { FlowProps, mergeProps, onCleanup, onMount, Show } from 'solid-js'

export type ScrollProps = InheritProps<FlowProps & {
  bottomThreshold?: number;
  onBottomTouched?: () => void;
  loading?: boolean;
  locked?: boolean;
  ref?: HTMLDivElement;
}>

const scrollPositionMap: Record<string, number> = {}

export default function Scroller (props: ScrollProps) {
  const id = uuidV4()
  const ps = mergeProps({
    bottomThreshold: 100,
    onBottomTouched: () => {},
    loading: false
  }, props)
  
  let scroller: HTMLDivElement | undefined
  
  const onScroll = throttle((e: Event) => {
    const target = e.target
    if (target) {
      const { scrollTop, scrollHeight, clientHeight } = target as HTMLDivElement
      scrollPositionMap[id] = scrollTop
      if (scrollHeight - scrollTop - clientHeight < ps.bottomThreshold && !ps.loading) {
        ps.onBottomTouched()
      }
    }
  }, 100)
  
  onMount(() => {
    scroller?.addEventListener('scroll', onScroll)
    
    onCleanup(() => {
      delete scrollPositionMap[id]
      scroller?.removeEventListener('scroll', onScroll)
    })
  })
  
  useActivated(() => {
    scroller?.scrollTo({
      top: scrollPositionMap[id] || ZERO,
      behavior: 'auto'
    })
  })

  function setRef (el: HTMLDivElement) {
    scroller = el
    if ('function' === typeof props.ref) {
      props.ref(el)
    } else if (props.ref) {
      (props.ref as HTMLDivElement) = el
    }
  }
  
  return (
    <div
      ref={setRef}
      class={classNames(props.locked ? '': 'overflow-y-auto', props.class)}
      style={props.style}
      data-srcoll-id={id}
    >
      {props.children}
      <Show when={ps.loading}>
        <div class="text-center my-2 col-span-full">
          <Spin class="h-6" />
        </div>
      </Show>
    </div>
  )
}
