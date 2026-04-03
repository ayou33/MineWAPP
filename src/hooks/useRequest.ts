/**
 * File: useRequest.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/4/25 15:05
 */
import { uuidV4 } from '@/common'
import { logFor } from '@/common/log'
import { APP_REQUEST_LABEL } from '@/config'
import { cancel, on } from '@/tools/request'
import { QueueState } from 'lunzi'
import { createSignal, onCleanup } from 'solid-js'

const log = logFor('useRequest')

export default function useRequest (label: string = APP_REQUEST_LABEL) {
  // 页面卸载时取消当前和队列中的请求
  onCleanup(() => {
    if (label !== APP_REQUEST_LABEL) {
      cancel(label, 'page clean up')
    }
  })
  
  /**
   * @warn 这个的run必须是一个可以消耗 id 和 label 两个参数的函数
   */
  return <T extends PromiseFn> (run: T) => {
    const [loading, setLoading] = createSignal(false)
    log('make request task with label:', label)
    
    const markedRun = (...args: Parameters<T>) => {
      const [data, options] = args
      const id = options?.id ?? `1${uuidV4()}`
      
      const offOnEnd = on(QueueState.INTERRUPT, (_, taskId: string) => {
        log('QueueState.INTERRUPT', 'taskId:', taskId, 'requestId:', id, 'request options:', options)
        if (taskId === id) {
          log('task is completed:', taskId)
          setLoading(false)
          offOnEnd()
        }
      })
      
      log('run request', 'requestId:', id, 'label:', label, 'request options:', options)
      
      setLoading(true)
      
      return run(data, {
        ...options,
        id,
        label,
      })
    }
    
    return [markedRun as T, loading] as const
  }
}
