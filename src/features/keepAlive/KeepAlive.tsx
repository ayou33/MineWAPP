import { logFor } from '@/common/log'
import { ACTIVATED, DEACTIVATED } from '@/features/keepAlive/KeepAliveContext'
import { useKeepAlive } from '@/features/keepAlive/hooks'
import { createMemo, createRoot, getOwner, onCleanup, onMount, ParentProps, runWithOwner } from 'solid-js'

const log = logFor('KeepAlive')

type KeepAliveProps = ParentProps<{
  id: string;
  cleanup?: () => void;
}>

export function KeepAlive (props: KeepAliveProps) {
  const [{ cached, living }, { event, keep, active, invalid }] = useKeepAlive()
  const parent = living()
  const memo = createMemo(() => cached().find(item => item.id === props.id))
  
  onMount(() => {
    if (memo()) {
      log(`activated [${memo()!.id}]`)
      event.emit(`${ACTIVATED}.${memo()!.id}`)
    }
  })
  
  onCleanup(() => {
    if (memo()) {
      log(`deactivated [${memo()!.id}]`)
      event.emit(`${DEACTIVATED}.${memo()!.id}`, () => {
        log(`invalidated [${memo()!.id}] manually`)
        invalid(memo()!.id)
      })
    }
  })
  
  if (!memo()) {
    log('creating new cache:', props.id)
    active(props.id)
    
    createRoot(dispose => {
      keep({
        id: props.id,
        children: props.children,
        owner: getOwner(),
        dispose,
        parent,
      })
      
      onCleanup(() => {
        event.off(`*.${props.id}`)
        props.cleanup?.()
      })
    })
  }
  
  const cache = memo()
  
  if (!cache) return null
  
  active(cache.id)
  
  if (cache.owner) return runWithOwner(cache.owner, () => cache.children)
  
  return cache.children
}

export default KeepAlive
