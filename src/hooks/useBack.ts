/**
 * File: useBack.ts of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/6/28 17:28
 */
import { NavigateOptions, useLocation, useNavigate } from '@solidjs/router'

type NavigateState = {
  from: string;
  options?: Partial<NavigateOptions>;
}

export const back2HomeState: NavigateState = {
  from: '/',
  options: {
    replace: true,
  }
}

export default function useBack () {
  const location = useLocation<NavigateState>()
  const navigate = useNavigate()
  
  function back () {
    // 通过 state.from 和其他附带信息 来做指定目标的返回操作
    if (location.state?.from) {
      navigate(location.state.from, {
        ...location.state?.options,
        state: {
          forward: true,
          ...location.state?.options?.state,
        }
      })
    } else {
      // navigate(-1)
      history.back()
    }
  }
  
  return back
}
