import ScopedPage from '@/provider/scopedPage/ScopedPage'
import { AUTH_ROLE } from '@/config'
import About from '@/module/about/About.index'

export default function AboutPage () {
  return <ScopedPage scope={AUTH_ROLE.PASSENGER}>{About}</ScopedPage>
}
