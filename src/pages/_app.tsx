import { on } from '@/common/event'
import PageLoading from '@/components/loading/Loading.page'
import Popups from '@/components/popups/Popups'
import Fallback from '@/components/RenderFallback'
import Tips from '@/components/tips/Tips'
import { AUTH_PATH, EVENTS, ONE_SECOND, SESSION_KEYS, USER_ROLE } from '@/config'
import useAppVisibilityState from '@/hooks/useAppVisibility'
import application from '@/app/application'
import { useNavigate, useIsRouting } from '@solidjs/router'
import { sessionGet, sessionSet } from 'lunzi'
import { ErrorBoundary, onCleanup, ParentProps, Show } from 'solid-js'

const HALF_MINUTE = 30

export default function _app (props: ParentProps) {
  const isRouting = useIsRouting()
  const navigate = useNavigate()

  useAppVisibilityState(() => {
    const from = +(sessionGet(SESSION_KEYS.DEACTIVATED_FROM) ?? NaN)
    const now = Date.now()
    if (!Number.isNaN(from) && (now - from) / ONE_SECOND > HALF_MINUTE) {
      // App woke up after 30s+ background — refresh data if needed
    }
  }, () => {
    sessionSet(SESSION_KEYS.DEACTIVATED_FROM, Date.now().toString())
  })

  onCleanup(on([EVENTS.LOGOUT, EVENTS.TOKEN_ERROR], login))

  function login () {
    if (application.role() !== USER_ROLE.GUEST) {
      navigate(AUTH_PATH, { replace: true })
    } else {
      console.log('sgs')
    }
  }

  return (
    <ErrorBoundary fallback={(err, reset) => <Fallback error={err} reset={reset} />}>
      <main>{props.children}</main>

      <Popups />
      <Tips />

      <Show when={isRouting()}><PageLoading /></Show>
    </ErrorBoundary>
  )
}
