/**
 * File: usePageContext.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/4/28 15:13
 */
import { on, emit } from '@/common/event'
import { PageContext, ScopedPageProps } from '@/provider/scopedPage/ScopedPage'
import { popup } from '@/components/popups/Popups'
import { toast } from '@/components/tips/Tips'
import useRequest from '@/hooks/useRequest'
import useTimer from '@/hooks/useTimer'
import { onCleanup, useContext } from 'solid-js'

export default function usePageContext (): ScopedPageProps {
  const ctx = useContext(PageContext)
  
  if (!ctx) {
    const listeners: (() => void)[] = []
    const request = useRequest()
    const { interval, delay } = useTimer()
    
    onCleanup(() => {
      listeners.forEach(off => off())
    })
    
    return {
      request,
      toast,
      popup,
      interval,
      delay,
      on (...args: Parameters<typeof on>) {
        const off = on(...args)
        listeners.push(on(...args))
        return off
      },
      emit,
    }
  }
  
  return ctx
}
