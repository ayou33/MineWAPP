import ScopedPage from '@/provider/scopedPage/ScopedPage'
import { AUTH_SCOPE } from '@/config'
import Home from '@/module/home/Home.index'

export default function HomePage () {
  return <ScopedPage scope={AUTH_SCOPE.PUBLIC}>{Home}</ScopedPage>
}
