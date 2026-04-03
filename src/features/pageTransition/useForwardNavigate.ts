/**
 * File: useForwardNavigate.ts of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/7/23 16:18
 */
import { useNavigate } from '@solidjs/router'

export function useForwardNavigate () {
  const navigate = useNavigate()

  return (href: string, options?: Parameters<typeof navigate>[1]) => navigate(href, {
    ...options,
    state: {
      ...options?.state ?? {},
      forward: true,
    },
  } as never)
}
