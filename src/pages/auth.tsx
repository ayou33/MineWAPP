import ScopedPage from '@/provider/scopedPage/ScopedPage'
import { AUTH_ROLE } from '@/config'
import Auth from '@/modules/auth/Auth.index'

export default function AuthPage () {
  return <ScopedPage scope={AUTH_ROLE.PASSENGER}>{Auth}</ScopedPage>
}
