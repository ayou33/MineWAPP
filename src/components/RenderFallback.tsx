/**
 * File: Checkbox.tsx of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/7/1 17:23
 */
import { A } from '@solidjs/router'
import copy from 'copy-to-clipboard'

export default function RenderFallback (props: { error: Error, reset: VoidFn }) {
  console.error('RenderFallback caught an error:', props.error)

  return (
    <div class="fixed z-system flex flex-col bg-blue size-full p-3 font-bold space-y-3 divide-y divide-dashed">
      <p>oops :( something went wrong!</p>
      <div class="space-y-2 flex-1 overflow-auto p-2">
        <p>@Name: {props.error.name}</p>
        <p>@Message: {props.error.message}</p>
        <p>@Cause: {props.error.cause as string ?? 'unknown'}</p>
        <p>@Stack: {props.error.stack}</p>
      </div>
      <div class="space-x-2 *:underline text-right">
        <button onClick={() => copy(String(props.error.stack))}>Copy Error</button>
        <A href="/">Home</A>
        <button onClick={props.reset}>Reset</button>
      </div>
    </div>
  )
}
