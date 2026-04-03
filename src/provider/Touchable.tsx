/**
 * File: Touchable.tsx of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/6/28 13:39
 */
import { logFor } from '@/common/log'
import { isPC } from '@/config'
import classNames from 'classnames'
import { FlowProps, mergeProps, onCleanup, splitProps, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'

const log = logFor('Touchable')

const default_min_hold_threshold = 300

type TouchableProps = InheritProps<FlowProps<{
  is?: ValidComponent;
  onTap: (e: MouseEvent) => void;
  onHold?: (e: MouseEvent) => void;
  onRelease?: (e: MouseEvent) => void;
  holdThreshold?: number;
}>>

export default function Touchable (props: Omit<TouchableProps, 'onClick'>) {
  const ps = mergeProps({
    is: 'div',
    holdThreshold: default_min_hold_threshold,
  }, props)
  const [local, others] = splitProps(ps, [
    'children', 'is', 'onTap', 'onHold', 'onRelease', 'holdThreshold', 'class'
  ])
  
  let isHold = false
  let holdTimer = 0
  
  const tapStart = isPC ? 'onMouseDown' : 'onTouchStart'
  const tapEnd = isPC ? 'onMouseUp' : 'onTouchEnd'
  const tapCancel = isPC ? 'mouseleave' : 'touchcancel'
  
  log('tap start event:', tapStart, 'tap end event:', tapEnd, 'tap cancel event:', tapCancel)
  
  const tapEvents = {
    [tapStart]: onTapStart,
    [tapEnd]: onTapEnd,
  }
  
  onCleanup(() => {
    clearTimeout(holdTimer)
  })
  
  function onTapStart (e: MouseEvent) {
    log('tap start')
    isHold = false
    holdTimer = window.setTimeout(() => {
      isHold = true
      local.onHold?.(e)
    }, local.holdThreshold)
    e.target?.addEventListener(tapCancel, onTapCancel)
  }
  
  function onTapEnd (e: MouseEvent) {
    log('tap end, isHold', isHold)
    clearTimeout(holdTimer)
    if (isHold) { local.onRelease?.(e) } else { local.onTap(e) }
  }
  
  function onTapCancel (e: Event) {
    log('tap cancel')
    onTapEnd(e as MouseEvent)
    e.target?.removeEventListener(tapCancel, onTapCancel)
  }
  
  return (
    <Dynamic
      component={local.is}
      class={classNames('select-none transition-all active:scale-[0.98]', local.class)}
      {...tapEvents}
      {...others}
    >
      {local.children}
    </Dynamic>
  )
}

/**
 * 语法糖
 * @param props
 */
Touchable.button = function (props: Omit<TouchableProps, 'is'>) {
  return <Touchable is="button" {...props} />
}

/**
 * 语法糖
 * @param props
 */
Touchable.span = function (props: Omit<TouchableProps, 'is'>) {
  return <Touchable is="span" {...props} />
}
