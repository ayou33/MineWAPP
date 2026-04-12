import ScopedPage from '@/provider/scopedPage/ScopedPage'
import { AUTH_SCOPE } from '@/config'
import Example from '@/module/example/Example.index'

export default function ExamplePage () {
  return <ScopedPage scope={AUTH_SCOPE.PUBLIC}>{Example}</ScopedPage>
}
