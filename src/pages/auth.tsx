import ScopedPage from '@/provider/scopedPage/ScopedPage'
import { AUTH_SCOPE } from '@/config'
import Auth from '@/module/auth/Auth.index'

export default function AuthPage () {
  return <ScopedPage scope={AUTH_SCOPE.PUBLIC}>{Auth}</ScopedPage>
}
