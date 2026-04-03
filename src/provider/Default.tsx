/**
 * File: Default.tsx of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/7/24 15:26
 */
import { children, createMemo, ParentProps } from 'solid-js'

export default function Default (props: ParentProps<{
  number?: true;
  to?: number;
} | {
  number?: false;
  to?: string;
}>) {
  const resolved = children(() => props.children)
  
  return createMemo(() => {
    if (props.number && typeof resolved() !== 'number') {
      return props.to ?? NaN
    }
    
    return props.children ?? props.to ?? '--'
  })()
}
