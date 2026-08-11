/**
 * File: FeatureAlternative.tsx of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/9/2 16:15
 *
 * Feature-flag-driven lazy loading: loads a module and renders its `default`
 * export when the feature is allowed, otherwise the module's optional `fallback`
 * export (if provided).
 */
import Alternative from '@/features/abTest/Alternative'
import { ifFeatureAllowed } from '@/features/abTest/ABTest'
import { Feature } from '@/features/abTest/feature.config'
import application from '@/app/application'

export default function FeatureAlternative (props: {
  load: PropsOf<typeof Alternative>['load'];
  feature: Feature;
}) {
  const userGroup = application.account.current()?.group as number | undefined

  return (
    <Alternative
      load={props.load}
      by={() => ifFeatureAllowed(props.feature, userGroup)}
      static
    />
  )
}
