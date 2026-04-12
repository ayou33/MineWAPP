/**
 * File: SkeletonBar.tsx of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/7/10 11:52
 */
import classNames from 'classnames'
import { ParentProps } from 'solid-js'

export default function SkeletonBar (props: InheritProps<ParentProps>) {
  return (
    <div class={classNames('bg-[var(--c-skeleton-bg)] h-4 rounded animate-slash', props.class)}>{props.children}</div>
  )
}
