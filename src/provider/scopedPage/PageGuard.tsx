/**
 * scoped page guard, 用来保护需要特定权限才能访问的页面,
 * 规则如下:
 * - 如果用户没有登录且访问AUTH_SCOPE.PRIVATE及以上授权级别的页面, 则重定向到登录页
 * - 如果用户已经登录但访问AUTH_SCOPE.AUTHED及以上授权级别的页面, 显示403错误
 *
 */
import application from '@/app/application'
import { AUTH_PATH, AUTH_ROLE } from '@/config'
import { t } from '@/features/i18n'
import { useNavigate } from '@solidjs/router'
import { createEffect, JSX, ParentProps, Show } from 'solid-js'

export default function PageGuard (props: ParentProps<{ scope?: AUTH_ROLE }>) {
  const navigate = useNavigate()
  const scope = () => props.scope ?? AUTH_ROLE.PASSENGER

  createEffect(() => {
    if (application.role() < AUTH_ROLE.USER && scope() >= AUTH_ROLE.USER) {
      navigate(AUTH_PATH, { replace: true })
    }
  })

  const is403 = () =>
    application.role() >= AUTH_ROLE.USER &&
    application.role() < scope() &&
    scope() >= AUTH_ROLE.AUTHED

  return (
    <Show when={!is403()} fallback={<Forbidden />}>
      {props.children}
    </Show>
  )
}

function Forbidden (): JSX.Element {
  return (
    <div class="flex flex-col items-center justify-center size-full">
      <p class="text-4xl font-bold">403</p>
      <p class="text-sm opacity-50 mt-2">{t('error.forbidden')}</p>
    </div>
  )
}
