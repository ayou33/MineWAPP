/**
 * Global state store — generic SolidJS store with typed selectors and scoped actions.
 *
 * To add a new state slice:
 *   1. Define its type and default value
 *   2. Add the key to the State type
 *   3. Add the default to the createStore call
 *   4. Create actions with createScopedActions('key', { ... })
 */
import * as R from 'ramda'
import { createMemo } from 'solid-js'
import { createStore, SetStoreFunction, Store } from 'solid-js/store'

type State = {
  user: {
    id: string | number | null
    name: string
    avatar: string
  }
}

const [store, setStore] = createStore<State>({
  user: {
    id: null,
    name: '',
    avatar: '',
  },
})

export function useSelector<T, F extends boolean = false> (fn: (state: Store<State>) => T, ensure?: F) {
  return createMemo(() => {
    const result = fn(store)
    if (ensure && R.isNil(result)) {
      throw new Error('target state unexpected nil')
    }
    return result as F extends true ? NotNull<T> : T
  })
}

export function createScopedActions<
  K extends keyof State,
  A extends Record<string, (setter: SetStoreFunction<State[K]>, ...args: any[]) => void>,
> (key: K, actions: A) {
  return Object.fromEntries(
    Object.entries(actions).map(([name, action]) => [
      name,
      (...args: any[]) => action(
        ((...args: [any]) => setStore(key, ...args)) as SetStoreFunction<State[K]>,
        ...args,
      ),
    ]),
  ) as {
    [P in keyof A]: (...args: TailParams<A[P]>) => void
  }
}
