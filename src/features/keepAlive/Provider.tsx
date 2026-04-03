import { on } from '@/common/event'
import { EVENTS } from '@/config'
import { Cache, KeepAliveContext } from '@/features/keepAlive/KeepAliveContext'
import { useEvent } from 'lunzi'
import { createSignal, onCleanup, ParentProps } from 'solid-js'

type ProviderProps = ParentProps<{
  max?: number;
}>

const event = useEvent()

export function KeepAliveProvider (props: ProviderProps) {
  const max = props.max || 10
  const [cached, setCached] = createSignal<Cache[]>([])
  const [living, setLiving] = createSignal<string | null>(null)
  const [parent, setParent] = createSignal<string | null>(null)
  
  function keep (target: Cache) {
    setCached(prev => [target, ...(prev.slice(0, Math.max(0, max - 1)))])
  }
  
  function active (id: string) {
    setParent(living())
    setLiving(id)
    
    setCached(prev => {
      const index = prev.findIndex(item => item.id === id)
      const item = prev[index]
      
      // Move the item to the front to lift its priority
      return item ? [item, ...prev.slice(0, index), ...prev.slice(index + 1)] : prev
    })
  }
  
  function invalid (id: string) {
    setCached(prev => {
      const index = prev.findIndex(item => item.id === id)
      if (index !== -1) {
        const newCached = [...prev]
        newCached[index].dispose()
        newCached.splice(index, 1)
        return newCached
      }
      return prev
    })
  }
  
  onCleanup(on(EVENTS.LOGOUT, () => {
    cached().map(it => it.dispose())
    setCached([])
  }))
  
  return (
    <KeepAliveContext.Provider value={[{ cached, parent, living }, { event, keep, active, invalid }]}>
      {props.children}
    </KeepAliveContext.Provider>
  )
}

export default KeepAliveProvider
