import { randomStr, uuidV4 } from '@/common'
import { logFor } from '@/common/log'
import { cancelToasts, toast as _toast } from '@/components/tips/Tips'
import { AUTH_SCOPE } from '@/config'
import PageGuard from '@/provider/scopedPage/PageGuard'
import useRequest from '@/hooks/useRequest'
import useTimer from '@/hooks/useTimer'
import { createContext, FlowProps, onCleanup, ParentProps, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { popup as _popup, cancelPopups } from '@/components/popups/Popups'
import { on, off, emit } from '@/common/event'

const log = logFor('Page')

type ScopedProps = {
  request: ReturnType<typeof useRequest>;
  toast: typeof _toast;
  popup: typeof _popup;
  interval: ReturnType<typeof useTimer>['interval'];
  delay: ReturnType<typeof useTimer>['delay'];
  on: typeof on;
  emit: typeof emit,
}

export const PageContext = createContext<ScopedProps>()

export type ScopedPageProps = ParentProps<ScopedProps>

function bindPageLabel<T extends AnyFn> (label: string, fn: T) {
  return function (...args: Parameters<T>) {
    const [message, option, meta] = args
    
    return fn(message, option, {
      ...meta,
      label,
      run () {
      },
    })
  }
}

function listen (ns: string) {
  return (...args: Parameters<typeof on>) => {
    const [event, ...rest] = args
    return on(`${event}.${ns}`, ...rest)
  }
}

function pub (ns: string) {
  return (...args: Parameters<typeof emit>) => {
    const [event, ...rest] = args
    return emit(`${event}.${ns}`, ...rest)
  }
}

export default function ScopedPage (pageProps: FlowProps<{ scope?: AUTH_SCOPE, pageCode?: string }, ValidComponent>) {
  const pageId = uuidV4()
  const pageName = randomStr()
  
  const { interval, delay } = useTimer()
  
  const request = useRequest(pageId)
  
  const toast = bindPageLabel(pageId, _toast)
  
  const popup = bindPageLabel(pageId, _popup)
  
  onCleanup(() => {
    log('cleanup')
    // cancel all pending and running toasts
    cancelToasts(pageId)
    cancelPopups(pageId)
    off(`*.${pageName}`)
  })
  
  const props = {
    request,
    toast,
    popup,
    interval,
    delay,
    on: listen(pageName),
    emit: pub(pageName),
  }
  
  return (
    <PageContext.Provider value={props}>
      <PageGuard scope={pageProps.scope}>
        <Dynamic component={pageProps.children} {...props} />
      </PageGuard>
    </PageContext.Provider>
  )
}
