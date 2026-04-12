/**
 * File: FeatureAlternative.tsx of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/9/2 16:15
 */
import Alternative from '@/components/Alternative'

export default function FeatureAlternative (props: {
  load: PropsOf<typeof Alternative>['load'];
  featureId: string;
}) {
  function by () {
    return true
  }
  
  return (
    <Alternative load={props.load} by={by} static />
  )
}
