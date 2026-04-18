import { uuidV4 } from '@/common'
import { isGT0 } from '@/common/predications'
import Popup from '@/components/popups/Popup'
import PCPopupShell from '@/components/popups/PCPopupShell'
import { isPC, ONE } from '@/config'
import { useIsRouting, useLocation } from '@solidjs/router'
import classNames from 'classnames'
import { stateQueue, TaskMeta, TaskRunType } from 'lunzi'
import * as R from 'ramda'
import { createEffect, createSignal, For, on, onCleanup, ParentProps, Show, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { Transition, TransitionGroup } from 'solid-transition-group'

export type PopupProps<T = unknown, TResult = unknown> = {
  close: (result?: TResult) => void,
} & T

export type PopupOptions<T extends Record<string, unknown> | undefined = undefined> = {
  immediate?: boolean;
  /** Title shown in the PC title bar (optional). */
  title?: string;
  /**
   * PC only — the click / pointer event that triggered the popup.
   * When provided the open/close animation originates from the event coordinates.
   */
  originEvent?: Pick<MouseEvent, 'clientX' | 'clientY'>;
  meta?: Partial<TaskMeta>;
  props?: {
    onClose?: VoidFn;
    onClosed?: VoidFn;
  } & T;
} & ({
  closeAsCancel: true;
  props: {
    onCancel: VoidFn;
  }
} | {
  closeAsCancel?: false;
})

type QueueItem = {
  id: string;
  label: string;
  component: ValidComponent,
  next: (result?: unknown) => void,
  props?: Data;
  title?: string;
  /** Viewport coordinates of the event origin for PC expand animation. */
  originPoint?: { x: number; y: number };
}

const queue = stateQueue()

const [popups, setPopups] = createSignal<QueueItem[]>([])

const closing: QueueItem[] = []

createEffect(on(popups, (value, _, prev) => {
  return closing.push(...R.difference(prev as QueueItem[], value)), value
}), [])

const defaultPopupOptions: PopupOptions = {
  // On PC, popups are modal dialogs that can coexist without serialisation —
  // multiple dialogs can stack naturally (z-index layering). Bypassing the queue
  // (TaskRunType.IMMEDIATE) means the dialog appears at once rather than waiting
  // for any previous popup to close first.
  // On mobile, popups are full-screen sheets that compete for the entire viewport,
  // so the queue ensures only one is shown at a time (TaskRunType.AUTO).
  immediate: isPC,
}

export function popup<
  T extends ValidComponent,
  P extends PropsOf<T>,
  TResult = void
> (
  component: T,
  options?: PopupOptions<Omit<P, 'close'>>,
): Promise<TResult | undefined> & { cancel: () => void } {
  const filledOptions = { ...defaultPopupOptions, ...options }
  const id = filledOptions.meta?.id ?? uuidV4()
  const label = filledOptions.meta?.label ?? location.pathname

  let resolveResult!: (result: TResult | undefined) => void
  const resultPromise = new Promise<TResult | undefined>(resolve => {
    resolveResult = resolve
  })

  queue.enqueue({
    ...filledOptions.meta,
    id,
    label,
    run (controller) {
      const running = filledOptions.meta?.run?.(controller)

      const queuePromise = new Promise<void>(resolve => {
        setPopups(prev => [...prev, {
          id,
          label,
          component,
          props: filledOptions.props,
          title: filledOptions.title,
          originPoint: filledOptions.immediate && filledOptions.originEvent
            ? { x: filledOptions.originEvent.clientX, y: filledOptions.originEvent.clientY }
            : undefined,
          next: (result?: unknown) => {
            setPopups(prev => prev.filter(item => item.id !== id))
            filledOptions.props?.onClose?.()
            if (filledOptions.closeAsCancel) filledOptions.props.onCancel?.()
            resolveResult(result as TResult | undefined)
            resolve()
          },
        }])
      })

      return running ? Promise.all([running, queuePromise]) : queuePromise
    },
  }, filledOptions.immediate ? TaskRunType.IMMEDIATE : TaskRunType.AUTO)

  const cancel = () => {
    popups().find(item => item.id === id)?.next()
  }

  return Object.assign(resultPromise, { cancel })
}

export function cancelPopups (idOrLabel: string) {
  queue.cancel(idOrLabel)
  setPopups(prev => prev.filter(item => item.label !== idOrLabel && item.id !== idOrLabel))
}

/**
 * Lay out popup action buttons.
 * On PC: right-aligned (`justify-end`). On mobile: start-aligned.
 */
export function PopupActions (props: ParentProps<{ class?: string }>) {
  return (
    <div class={classNames('flex gap-3', isPC ? 'justify-end' : 'justify-start', props.class)}>
      {props.children}
    </div>
  )
}

export default function Popups () {
  const isRouting = useIsRouting()
  const timers: number[] = []
  
  function onRemoved (el: Element) {
    const closed = closing.findIndex(it => it.id === el.id)
    if (~closed) {
      closing[closed].props?.onClosed?.()
      closing.splice(closed, ONE)
    }
  }
  
  function forceRemove (el: Element, teardown: VoidFn) {
    // Safety net: if transitionend never fires, force DOM removal after timeout.
    // Cleanup of `closing` array is handled exclusively by onAfterExit → onRemoved.
    const SAFETY_MARGIN = 100
    const duration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--transition-duration')) || 300
    timers.push(window.setTimeout(teardown, duration + SAFETY_MARGIN))
  }
  
  // 路由变化时 关闭当前路由的所有弹窗
  createEffect((prePath: string) => {
    cancelPopups(prePath)
    return useLocation().pathname
  }, location.pathname)
  
  onCleanup(() => timers.forEach(clearTimeout))
  
  return (
    <>
      <TransitionGroup name={isPC ? 'popup-pc' : 'rise-reverse'} onExit={forceRemove} onAfterExit={onRemoved}>
        <For each={popups()}>
          {(item, index) =>
            <Popup
              id={item.id}
              style={{
                'z-index': index() + 2,
                ...(isPC && item.originPoint
                  ? { '--popup-ox': `${item.originPoint.x}px`, '--popup-oy': `${item.originPoint.y}px` }
                  : {}),
              }}
            >
              <Show when={!isRouting()}>
                {isPC
                  ? (
                    <PCPopupShell title={item.title} onClose={item.next}>
                      <Dynamic component={item.component} close={item.next} {...item.props} />
                    </PCPopupShell>
                  )
                  : <Dynamic component={item.component} close={item.next} {...item.props} />
                }
              </Show>
            </Popup>
          }
        </For>
      </TransitionGroup>
      <Show when={isGT0(popups().length)}>
        <Transition name="fade" appear>
          <div class="mask fixed inset-0 bg-black/80" style={{ 'z-index': popups().length }} />
        </Transition>
      </Show>
    </>
  )
}
