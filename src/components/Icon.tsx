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

/**
 * Global lazy-wrapper cache keyed by icon name.
 *
 * CRITICAL: `lazy()` must be called EXACTLY ONCE per icon name for the lifetime
 * of the app. Each `lazy()` call creates an independent wrapper with its own
 * "not-loaded" internal state. Even if the underlying ES module is already in
 * the browser cache, a freshly-created lazy wrapper starts in "pending" state
 * and will trigger the nearest Suspense boundary — causing the global
 * <PageLoading /> fallback to flash whenever a new wrapper is instantiated
 * (e.g., on first error render or on icon-name change in PasswordInput).
 *
 * By caching wrappers here, we guarantee that once an icon name is loaded,
 * all subsequent renders of that same name are synchronous and Suspense-free.
 */
const _lazyCache = new Map<string, Component<LucideProps>>()

function getIcon (name: string): Component<LucideProps> | undefined {
  if (!_lazyCache.has(name)) {
    const key = `/node_modules/lucide-solid/dist/esm/icons/${toKebabCase(name)}.js`
    const loader = iconModules[key]
    if (!loader) return undefined
    _lazyCache.set(name, lazy(loader) as Component<LucideProps>)
  }
  return _lazyCache.get(name)
}

export default function Icon (props: IconsProps) {
  const [local, others] = splitProps(props, ['name', 'class', 'size', 'color', 'strokeWidth'])

  const icon = createMemo(() => getIcon(local.name))

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
