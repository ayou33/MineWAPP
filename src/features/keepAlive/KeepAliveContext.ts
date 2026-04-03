/**
 * File: context.ts of Solid TS
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/4/29 18:11
 */
import { useEvent } from 'lunzi'
import { Accessor, createContext, JSX, Owner } from 'solid-js'

const event = useEvent()

export type KeepAliveEvent = typeof event

export type Cache = {
  id: string;
  children: JSX.Element;
  dispose: VoidFn;
  owner: Owner | null;
  parent: string | null;
}

export const ACTIVATED = 'activated'

export const DEACTIVATED = 'deactivated'

type Keep = (cache: Cache) => void

type Active = (id: string) => void

type Invalid = (id: string) => void

export type KeepAliveContextProps = [{
  cached: Accessor<Cache[]>;
  living: Accessor<string | null>;
  parent: Accessor<string | null>;
}, {
  event: KeepAliveEvent,
  keep: Keep;
  active: Active;
  invalid: Invalid;
}]

export const KeepAliveContext = createContext<KeepAliveContextProps>([
  {
    cached: () => [],
    living: () => null,
    parent: () => null,
  },
  {
    event,
    keep: () => {
      console.error('KeepAliveContext "keep" function is not initialized')
    },
    active: () => {
      console.error('KeepAliveContext "active" function is not initialized')
    },
    invalid: () => {
      console.error('KeepAliveContext "invalid" function is not initialized')
    },
  },
])

export default KeepAliveContext
