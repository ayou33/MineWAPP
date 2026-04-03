/**
 * File: useTimer.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/4/29 10:58
 */
import { ONE, ONE_SECOND, ZERO } from '@/config'
import { createSignal, onCleanup, untrack } from 'solid-js'

export default function useTimer () {
  const clocks: number[] = []
  
  onCleanup(() => {
    // cancel all pending timers
    clocks.forEach(id => {
      clearTimeout(id)
      clearInterval(id)
    })
    clocks.length = 0
  })
  
  function interval (...args: Parameters<typeof window.setInterval>) {
    const id = window.setInterval(...args)
    clocks.push(id)
    return id
  }
  
  function delay (...args: Parameters<typeof window.setTimeout>) {
    const [fn, ms, ...rest] = args
    const id = window.setTimeout(() => {
      clocks.splice(clocks.indexOf(id), ONE)
      fn(...rest)
    }, ms)
    clocks.push(id)
    return id
  }
  
  const defaultCDOptions = {
    step: ONE_SECOND,
    align: false, // 是否对齐到step的整数倍
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTick (left: number) {
      // console.log('onTick hook[', 'left:', left, ']')
    },
    timeout: () => {},
  }
  
  function cd (duration: number, options?: Partial<typeof defaultCDOptions>) {
    let timer = 0
    const config = { ...defaultCDOptions, ...options }
    const [left, setLeft] = createSignal(duration)
    
    function stop () {
      clearInterval(timer)
      clearTimeout(timer)
      setLeft(ZERO)
    }
    
    function start (from?: number) {
      stop()
      
      const left = from ?? duration
      
      if (Number.isNaN(left)) return
      
      // 如果duration - step无法趋近于0，则直接返回duration
      if (left === ZERO || Math.abs(ZERO - (left - config.step)) >= Math.abs(ZERO - left)) {
        return
      }
      
      const remainder = left % config.step
      setLeft(config.align ? left + (config.step - remainder) : left)
      
      if (config.align) {
        timer = delay(() => {
          setLeft(left - remainder)
          timer = tik()
        }, remainder)
      } else {
        timer = tik()
      }
    }
    
    function tik () {
      const _left = untrack(left)
      
      if (
        config.step > ZERO && _left <= ZERO ||
        config.step < ZERO && _left >= ZERO
      ) {
        stop()
        config.timeout?.()
        return timer
      }

      return interval(() => {
        const next = left() - config.step
        setLeft(next)
        config.onTick(next)
        if (next <= ZERO) { // Changed from next === ZERO to next <= ZERO
          stop()
          config.timeout?.()
        }
      }, config.step)
    }
    
    return [left, start, stop] as const
  }
  
  return { interval, delay, cd }
}
