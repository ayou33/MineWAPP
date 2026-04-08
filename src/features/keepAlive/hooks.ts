/**
 * File: hooks.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/4/29 18:13
 */
import KeepAliveContext, { ACTIVATED, DEACTIVATED } from '@/features/keepAlive/KeepAliveContext'
import { createEffect, onCleanup, useContext } from 'solid-js'

export function useKeepAlive () {
  return useContext(KeepAliveContext)
}

export function useActivated (fn: (activeId: string) => unknown) {
  const [{ living }] = useKeepAlive()
  const id = living()
  if (!id) {
    console.warn('useActivated must be used in a KeepAlive component')
    return
  }

  const activeId = `${ACTIVATED}.${id}`

  // 使用响应式信号替代事件订阅：
  // createEffect 在组件函数执行时立即进行初始检查，异步挂载的组件（Suspense 内）
  // 也能在加载完成后立即感知到当前激活状态，无需外部 re-emit 机制。
  createEffect(() => {
    if (living() === id) {
      const teardown = fn(activeId)
      if ('function' === typeof teardown) {
        onCleanup(teardown as AnyFn)
      }
    }
  })
}

export function useDeactivated (fn: EventListener) {
  const [{ living }, { event }] = useKeepAlive()
  const id = living()
  if (!id) {
    console.warn('useDeactivated must be used in a KeepAlive component')
    return
  }
  
  event.on(`${DEACTIVATED}.${id}`, fn)
}
