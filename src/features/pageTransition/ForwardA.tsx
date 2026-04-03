/**
 * File: ForwardA.tsx of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/7/3 16:23
 */
import { A } from '@solidjs/router'
import { splitProps } from 'solid-js'

export default function ForwardA (props: Parameters<typeof A>[0]) {
  const [local, other] = splitProps(props, ['children'])
  
  return (
    <A {...other} state={{ ...(other.state as object), forward: true }}>{local.children}</A>
  )
}
