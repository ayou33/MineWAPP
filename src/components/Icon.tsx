import { Icon as I } from '@iconify-icon/solid'
import classNames from 'classnames'

type IconsProps = {
  name: string
  set?: string
}

export default function Icon (props: InheritProps<IconsProps>) {
  return <I icon={`${props.set ?? 'line-md'}:${props.name}`} class={classNames(props.class)} style={props.style} />
}
