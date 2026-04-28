import ScopedPage from '@/provider/scopedPage/ScopedPage'
import { AUTH_ROLE } from '@/config'
import Home from '@/modules/home/Home.index'

export default function HomePage () {
  return <ScopedPage scope={AUTH_ROLE.PASSENGER}>{Home}</ScopedPage>
}
