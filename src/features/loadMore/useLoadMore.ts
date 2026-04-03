/**
 * File: useLoadMore.ts of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/7/2 11:17
 */
import { isZero } from '@/common/predications'
import { ONE } from '@/config'
import useBoolean from '@/hooks/useBoolean'
import { Pagination } from '@/tools/request'
import * as R from 'ramda'
import { createMemo, createSignal, untrack } from 'solid-js'

const DEFAULT_PAGE_SIZE = 10
const FIRST_PAGE = 1

export default function useLoadMore<
  T extends PromiseFn,
  R extends PromiseFnReturn<T>,
  P extends Omit<Parameters<T>[0], keyof Pagination>,
  F = R extends (infer U)[] ? U : never,
  D = F extends Record<string, unknown> ? F : never,
> (
  request: T,
  mix: Data | (() => Data) | number = DEFAULT_PAGE_SIZE,
  pageSize = 'number' === typeof mix ? mix : DEFAULT_PAGE_SIZE,
) {
  let pageNum = FIRST_PAGE
  let nextPage = pageNum
  
  const [loading, { setTrue: startLoading, setFalse: endLoading }] = useBoolean(false)
  const [loaded, setLoaded] = createSignal<D[]>([])
  const isEmpty = createMemo(() => R.isEmpty(loaded()), false)
  const [haveMore, { setTrue: makeUnknown, set: makeSure }] = useBoolean(true)
  
  function commonParams () {
   return 'function' === typeof mix
      ? mix()
      : 'number' === typeof mix
        ? { pageSize: mix }
        : 'object' === typeof mix
          ? mix
          : {}
  }
  
  async function load (data?: P): Promise<D[]> {
    if (!untrack(haveMore)) return Promise.resolve([])
    
    startLoading()
    const resp = await request({
      pageNum: nextPage,
      pageSize,
      ...commonParams(),
      ...data,
    })
      .finally(endLoading)
    
    const result = resp ?? []
    makeSure(result.length >= pageSize)
    pageNum = nextPage
    return result
  }
  
  async function refresh (data?: P) {
    nextPage = FIRST_PAGE
    makeUnknown()
    const resp = await load(data)
    setLoaded(resp)
    return resp
  }
  
  async function retry (data?: P) {
    nextPage = pageNum
    const resp = await load(data)
    setLoaded(prev => [...prev, ...resp])
    return resp
  }
  
  async function loadMore (data?: P) {
    if (R.isEmpty(untrack(loaded))) return refresh(data)
    
    nextPage += ONE
    const resp = await load(data)
    setLoaded(prev => [...prev, ...resp])
    return resp
  }
  
  async function loadPage (index: number) {
    nextPage = index
    const resp = await load()
    setLoaded(resp)
    return resp
  }
  
  async function patchAll (uniq: (it: D) => D[keyof D], data?: P) {
    startLoading()
    return await request({
      pageNum: ONE,
      pageSize: pageSize * pageNum,
      ...commonParams(),
      ...data
    })
      .then(resp => {
        const fresh = resp ?? []
        const exist = [...untrack(loaded)]
        const added: D[] = R.without(exist, fresh)
        const removed = R.without(fresh, exist)
        
        // nothing changed update ignore
        if (isZero(added.length) && isZero(removed.length)) {
          return exist
        }
        
        const removedIds = R.map(uniq, removed)
        const freshKeyMap: Record<string, number> = R.reduce((acc, it: D) => {
          return {
            [uniq(it) as string]: acc.total,
            total: acc.total + ONE,
          }
        }, { total: 0 }, fresh)
        
        for (let i = 0, l = exist.length; i < l; i++) {
          const it = exist[i]
          if (R.includes(uniq(it), removedIds)) {
            const alt = added.shift()
            if (alt) {
              // replace
              exist.splice(i, ONE, alt)
            } else {
              // delete
              exist.splice(i, ONE)
              i--
              l--
            }
          } else {
            // update
            const patch = fresh[freshKeyMap[uniq(it) as string]]
            if (patch) {
              exist[i] = patch
            }
          }
        }
        
        return setLoaded(exist)
      })
      .catch(() => [])
      .finally(endLoading)
  }

  async function patch (uniq: (it: D) => D[keyof D], data?: P) {
    startLoading()
    return await request({
      pageNum: ONE,
      pageSize: pageSize * pageNum,
      ...commonParams(),
      ...data
    }).then(resp => {
      const fresh = resp ?? []
      const exist = [...untrack(loaded)]

      for (let i = 0, l = exist.length; i < l; i++) {
        for (let j = 0; j < fresh.length; j++) {
          if (uniq(exist[i]) === uniq(fresh[j])) {
            exist[i] = fresh[j]
          }
        }
      }
      return setLoaded(exist)
    }).catch(() => []).finally(endLoading)
  }
  
  function ifIdle<T extends PromiseFn<D[]>> (action: T, busyPred = () => false) {
    return (...p: Parameters<T>) => {
      if (untrack(loading) || busyPred()) return Promise.resolve([])
      
      return action(...p)
    }
  }
  
  // [data, actions, states]
  return [
    loaded,
    {
      refresh: ifIdle(refresh),
      retry: ifIdle(retry),
      loadMore: ifIdle(loadMore, () => !haveMore),
      loadPage: ifIdle(loadPage),
      patchAll: ifIdle(patchAll),
      patch: ifIdle(patch),
      set: setLoaded
    },
    { loading, isEmpty, haveMore },
  ] as const
}
