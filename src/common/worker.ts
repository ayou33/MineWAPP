/**
 * File: worker.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/5/11 11:38
 */
import { uuidV4 } from '@/common/index'
import * as R from 'ramda'

export const isSupportWorker = 'function' === typeof window.Worker

type HookType = 'before' | 'after'

type HookName = `${HookType}:${string}`

function postMessage (worker: Worker, method: string, args: unknown[], callId: string) {
  const copy = args.map(it => {
    if (R.is(Object, it) && !Array.isArray(it)) {
      const obj = it as Record<string, unknown>
      const { signal, ...rest } = obj
      if (signal instanceof AbortSignal) {
        const id = uuidV4()
        signal.addEventListener('abort', function onAbort (e) {
          worker.postMessage({ method: 'abort', args: [id, (e.target as AbortSignal).reason] })
          signal.removeEventListener('abort', onAbort)
        })
        return { ...rest, signal: id }
      }
      return rest
    }

    return it
  })

  worker.postMessage({ method, args: copy, callId })
}

/**
 * Create a worker instance
 * @param workerPath {string} - the path of the worker file placed in the public directory
 */
export function createWorker (workerPath: string) {
  const handlerMap = new Map<string, AnyFn>()
  let worker: Worker | null = null
  const interceptors = new Map<HookName, AnyFn[]>()

  function rejectAll (reason: Error) {
    handlerMap.forEach(handler => handler(reason, undefined))
    handlerMap.clear()
  }

  if (isSupportWorker) {
    worker = new Worker(workerPath)

    worker.onerror = (e) => {
      rejectAll(new Error(e.message ?? 'WORKER_ERROR'))
      worker?.terminate()
      worker = null
    }

    worker.onmessage = (e) => {
      const { callId, error, result } = e.data
      const handler = handlerMap.get(callId)

      if (handler) handler(error, result)
    }

    worker.onmessageerror = (e) => {
      const { callId } = e.data
      const handler = handlerMap.get(callId)

      if (handler) handler(new Error('message can not be deserialized'))
    }
  }

  function callHooks<T> (method: string, args: T, type: HookType = 'before') {
    const handlers = interceptors.get(`${type}:${method}`)

    if (!handlers || R.isEmpty(handlers)) return args

    return R.reduce((acc, interceptor) => interceptor(acc), args, handlers)
  }

  /**
   * Invoke a method in the worker
   * if worker is not available or execution error, fallback will be called
   * @param method {string}
   * @param fallback {Function}
   */
  function invoke<
    T,
    P,
    F extends (...args: P[]) => Promise<T> = (...args: P[]) => Promise<T>
  > (method: string, fallback?: F) {
    return (...args: P[]) => {
      if (!worker) {
        console.warn('worker is not available, continue with fallback!')
        return fallback?.(...args) ?? Promise.reject(new Error('WORKER_NOT_AVAILABLE'))
      }

      const callId = uuidV4()

      const _args = callHooks(method, args)

      try {
        postMessage(worker, method, _args, callId)
      } catch {
        if (fallback) {
          return fallback(...args)
        }
        return Promise.reject(new Error('WORKER_POST_FAILED'))
      }

      return new Promise<T>((resolve, reject) => {
        handlerMap.set(callId, (e: Error, result: T) => {
          if (fallback && e?.message === 'NOT_REGISTERED') {
            console.warn(`worker method [${method}] is not registered, continue with fallback!`)
            fallback(...args)
              .then(resolve)
              .catch(reject)
          } else {
            if (e) {
              reject(e)
            } else {
              try {
                resolve(callHooks(method, result, 'after'))
              } catch (e) {
                reject(e)
              }
            }
          }
          handlerMap.delete(callId)
        })
      })
    }
  }

  /**
   * Register a event handler for the worker's message
   * @param name {string}
   * @param handler {Function}
   * @param oneoff {boolean} - unregister after first call
   */
  function register<T> (name: string, handler: (...args: T[]) => void, oneoff = false) {
    function fn (e: MessageEvent) {
      const { event, args } = e.data
      if (event === name) {
        handler(...args)

        if (oneoff) {
          worker?.removeEventListener('message', fn)
        }
      }
    }

    worker?.addEventListener('message', fn)

    return () => worker?.removeEventListener('message', fn)
  }

  function intercept<T, F = T> (name: string, interceptor: (...args: T[]) => F, type: HookType = 'before') {
    const hook: HookName = `${type}:${name}`
    const handlers = interceptors.get(hook) ?? []
    handlers.push(interceptor)
    interceptors.set(hook, handlers)

    return () => {
      const list = interceptors.get(hook)
      if (list) {
        const idx = list.indexOf(interceptor as AnyFn)
        if (idx !== -1) list.splice(idx, 1)
      }
    }
  }

  return {
    invoke,
    register,
    intercept,
    terminate () {
      rejectAll(new Error('WORKER_TERMINATED'))
      worker?.terminate()
      worker = null
    },
  }
}
