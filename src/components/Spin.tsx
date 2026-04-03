/**
 * File: Spin.tsx of CE.Solid.Ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/6/12 19:29
 */
import classNames from 'classnames'
import { ParentProps } from 'solid-js'

export default function Spin (props: InheritProps<ParentProps>) {
  return (
    <span class={classNames('inline-block h-1/2 min-h-4 min-w-4 aspect-square rounded-full border-solid border-2 border-l-transparent align-middle animate-spin', props.class)} style={props.style}></span>
  )
}
