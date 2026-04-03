import { uuidV4 } from '@/common'
import Tip from '@/components/tips/Tip'
import { TipPosition, TipType } from '@/config'
import { stateQueue, TaskMeta } from 'lunzi'
import { createSignal, For, Show, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'

const queue = stateQueue()

export type TipOption<T extends Data = Data> = {
  autoClose: boolean;
  duration: number;
  type: TipType;
  position: TipPosition;
  props?: T
}

export type TipProps<T extends Data = Data> = {
  close: VoidFn
} & T

type QueueItem = {
  id: string;
  label?: string;
  option: TipOption;
  component: ValidComponent,
  next: () => void,
  props?: Data
}

const defaultTipDuration = 3000

const defaultOption: TipOption = {
  autoClose: true,
  duration: defaultTipDuration,
  type: TipType.SUCCESS,
  position: TipPosition.TOP,
}

const [messages, setMessages] = createSignal<QueueItem[]>([])

export function toast<
  T extends ValidComponent,
  P extends PropsOf<T>,
> (message: T, option?: Partial<TipOption<Omit<P, 'close'>>>, meta?: TaskMeta) {
  const id = meta?.id ?? uuidV4()
  
  queue.enqueue({
    ...meta,
    id,
    run (controller) {
      const running = meta?.run?.(controller)
      const options = { ...defaultOption, ...option }
      
      const promise = new Promise<void>(resolve => {
        setMessages(prev => [...prev, {
          id,
          label: meta?.label,
          option: options,
          component: message,
          props: options.props,
          next () {
            resolve()
            setMessages(prev => prev.filter(item => item.id !== id))
          },
        }])
      })
      
      return running ? Promise.all([running, promise]) : promise
    },
  })
  
  return id
}

export function cancelToasts (label: string) {
  queue.cancel(label)
  setMessages(prev => prev.filter(item => item.label !== label))
}

export default function Toast () {
  return (
    <For each={messages()}>
      {
        message =>
        <Tip onComplete={message.next} option={message.option}>
          <Show
            when={typeof message.component === 'string'}
            fallback={<Dynamic component={message.component} close={message.next} {...message.props} />}
          >
            {message.component}
          </Show>
        </Tip>
      }
    </For>
  )
}
