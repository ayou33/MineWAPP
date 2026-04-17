import { AUTH_PATH, AUTH_ROLE } from '@/config'
import application from '@/app/application'
import { useNavigate } from '@solidjs/router'
import { createEffect } from 'solid-js'

export default function useAuthenticate (required = AUTH_ROLE.USER) {
  const navigate = useNavigate()

  createEffect(() => {
    if (application.role() < required) {
      navigate(AUTH_PATH, { replace: true })
    }
  })

  if (application.role() < required) {
    navigate(AUTH_PATH, { replace: true })
    return null
  }
}
