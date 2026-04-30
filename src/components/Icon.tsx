import { Icon as I } from '@iconify-icon/solid'
import classNames from 'classnames'

type IconsProps = {
  name: string
  set?: string
  size?: number | string
  color?: string
}

export default function Icon (props: InheritProps<IconsProps>) {
  return (
    <I
      icon={`${props.set ?? 'line-md'}:${props.name}`}
      class={classNames('iconify-icon', props.class)}
      width={props.size as string}
      height={props.size as string}
      style={{ ...(props.color ? { color: props.color } : {}), ...(props.style || {}) }}
    />
  )
}
