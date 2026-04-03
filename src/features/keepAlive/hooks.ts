/**
 * File: hooks.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/4/29 18:13
 */
import KeepAliveContext, { ACTIVATED, DEACTIVATED } from '@/features/keepAlive/KeepAliveContext'
import { onCleanup, useContext } from 'solid-js'

export function useKeepAlive () {
  return useContext(KeepAliveContext)
}

export function useActivated (fn: (activeId: string) => unknown) {
  const [{ living }, { event }] = useKeepAlive()
  const id = living()
  if (!id) {
    console.warn('useActivated must be used in a KeepAlive component')
    return
  }
  
  const activeId = `${ACTIVATED}.${id}`
  
  onCleanup(event.on(activeId, () => {
    const teardown = fn(activeId)
    if ('function' === typeof teardown) {
      event.once(`${DEACTIVATED}.${id}`, teardown as AnyFn)
    }
  }))
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
