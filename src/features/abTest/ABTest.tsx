/**
 * File: ABTest.tsx of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/9/5 20:05
 *
 * Core A/B test component — do not edit for project-specific concerns.
 * See feature.config.ts to define features and rollout rules.
 */
import Alternative from '@/features/abTest/Alternative'
import { NOT_EXIST } from '@/config'
import { compatible, FeatureControl } from './abTest.engine'
import { ControlledFeatures, Feature, platformContext } from './feature.config'
import { JSX, ParentProps, Show, splitProps } from 'solid-js'
import application from '@/app/application'

export function ifFeatureAllowed (feature: Feature, userGroup?: number): boolean {
  if (!userGroup) return false

  const control: FeatureControl | undefined = ControlledFeatures[feature]

  // Group check
  const groupAllowed = (control?.groups ?? [userGroup]).indexOf(userGroup) !== NOT_EXIST

  // Version / platform check
  const versionAllowed = compatible(control, platformContext)

  return groupAllowed && versionAllowed
}

export default function ABTest (props: {
  feature: Feature;
  load?: PropsOf<typeof Alternative>['load'];
  [key: string]: unknown;
} & ParentProps<{
  fallback?: JSX.Element;
}>) {
  const [local, rest] = splitProps(props, ['feature'])
  const userGroup = application.account.current()?.group as number | undefined
  
  // 动态加载
  if (rest.load) {
    return <Alternative {...rest} static by={() => ifFeatureAllowed(local.feature, userGroup)} load={rest.load} />
  }
  
  // 静态加载
  return (
    <Show when={ifFeatureAllowed(local.feature, userGroup)} fallback={rest.fallback}>
      {rest.children}
    </Show>
  )
}
