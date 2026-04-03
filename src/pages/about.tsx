import ScopedPage from '@/provider/ScopedPage'
import { AUTH_SCOPE } from '@/config'
import About from '@/module/about/About.index'

export default function AboutPage () {
  return <ScopedPage scope={AUTH_SCOPE.PUBLIC}>{About}</ScopedPage>
}
