import { Component, createMemo, lazy, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import type { LucideProps } from 'lucide-solid'

const DEFAULT_SIZE = 24 // 24px
const DEFAULT_STROKE_WIDTH = 2 // 2px

type IconsProps = {
  name: string
  size?: number | string
  color?: string
  strokeWidth?: number
  class?: string
  style?: string | Record<string, string>
}

type IconModule = { default: Component<LucideProps> }

const iconModules = import.meta.glob<IconModule>(
  '/node_modules/lucide-solid/dist/esm/icons/*.js',
)

function toKebabCase (str: string) {
  return str.replace(/([A-Z])/g, (_, c, i) => (i > 0 ? '-' : '') + c.toLowerCase())
}

export default function Icon (props: IconsProps) {
  const [local, others] = splitProps(props, ['name', 'class', 'size', 'color', 'strokeWidth'])

  const icon = createMemo(() => {
    const key = `/node_modules/lucide-solid/dist/esm/icons/${toKebabCase(local.name)}.js`
    const loader = iconModules[key]
    return loader ? lazy(loader) : undefined
  })

  return (
    <Dynamic
      component={icon()}
      size={local.size ?? DEFAULT_SIZE}
      color={local.color ?? 'currentColor'}
      strokeWidth={local.strokeWidth ?? DEFAULT_STROKE_WIDTH}
      absoluteStrokeWidth
      class={local.class}
      {...others}
    />
  )
}
