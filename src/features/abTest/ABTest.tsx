/**
 * File: ABTest.tsx of claw-eden-ts
 * Author: 阿佑[ayooooo@petalmail.com]
 * Date: 2024/9/5 20:05
 */
import Alternative from '@/features/abTest/Alternative'
import { NOT_EXIST } from '@/config'
import { ControlledFeatures, Feature } from './sample-feature'
import { JSX, ParentProps, Show, splitProps } from 'solid-js'
import application from '@/app/application'

export function ifFeatureAllowed (feature: Feature, userGroup?: number) {
  if (!userGroup) return false
  
  return (ControlledFeatures[feature]?.groups ?? [userGroup]).indexOf(userGroup) !== NOT_EXIST
}

export default function ABTest (props: {
  feature: Feature;
  load?: PropsOf<typeof Alternative>['load'];
  [key: string]: unknown;
} & ParentProps<{
  fallback?: JSX.Element;
}>) {
  const [local, rest] = splitProps(props, ['feature'])
  
  // 动态加载
  if (rest.load) {
    return <Alternative {...rest} static by={() => ifFeatureAllowed(local.feature, application.userGroup())} load={rest.load} />
  }
  
  // 静态加载
  return (
    <Show when={ifFeatureAllowed(local.feature, application.userGroup())} fallback={rest.fallback}>
      {rest.children}
    </Show>
  )
}
