/**
 * App component, the root of the app. It handles app visibility changes and global events like logout or token errors.
 */
import { on } from '@/common/event'
import Popups from '@/components/popups/Popups'
import Tips from '@/components/tips/Tips'
import { AUTH_PATH, EVENTS, ONE_SECOND, SESSION_KEYS } from '@/config'
import useAppVisibilityState from '@/hooks/useAppVisibility'
import { useNavigate } from '@solidjs/router'
import { sessionGet, sessionSet } from 'lunzi'
import { onCleanup, ParentProps } from 'solid-js'
import BreakNews from './BreakNews'

const HALF_MINUTE = 30

export default function _app (props: ParentProps) {
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
    navigate(AUTH_PATH, { replace: true })
  }

  return (
    <>
      <BreakNews />

      <main>{props.children}</main>

      <Popups />
      <Tips />
    </>
  )
}
