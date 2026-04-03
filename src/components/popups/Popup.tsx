import classNames from 'classnames'
import { ParentProps } from 'solid-js'

export default function Popup (props: ParentProps<InheritProps<{ id: string }>>) {
  return (
    <div class={classNames('fixed top-0 right-0 bottom-0 left-0 size-full flex items-center justify-center overflow-hidden', props.class)} id={props.id} style={props.style}>{props.children}</div>
  )
}
