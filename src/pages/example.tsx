import ScopedPage from '@/provider/scopedPage/ScopedPage'
import { AUTH_ROLE } from '@/config'
import Example from '@/module/example/Example.index'

export default function ExamplePage () {
  return <ScopedPage scope={AUTH_ROLE.PASSENGER}>{Example}</ScopedPage>
}
