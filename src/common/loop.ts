/**
 * File: loop.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/5/10 17:35
 */
type R<T> = T extends (...args: any[]) => infer R
  ? (R extends Promise<infer V> ? V : R)
  : never

type LoopOptions<T extends AnyFn> = {
  run: T;
  check: (v: R<T>, count: number) => Promise<boolean> | boolean;
} & Partial<{
  count: number;
  interval: number,
  controller: AbortController,
}>

export function loop<T extends AnyFn> (options: LoopOptions<T>) {
  const config: Required<LoopOptions<T>> = {
    count: Infinity,
    interval: 1000,
    controller: new AbortController(),
    ...options,
  }
  
  let count = 0
  let timer = 0
  
  config.controller.signal.addEventListener('abort', stop)
  
  function stop () {
    clearTimeout(timer)
  }
  
  async function run () {
    const result = await config.run()
    const goon = await config.check(result, ++count)
    if (goon && count < config.count) {
      clearTimeout(timer)
      timer = window.setTimeout(run, Math.max(config.interval, 0))
    }
  }
  
  run()
  
  return stop
}

export default loop
