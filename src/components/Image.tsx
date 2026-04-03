import classNames from 'classnames'
import { createEffect, createSignal, on, onMount, splitProps } from 'solid-js'

export type ImageProps = InheritProps<{
  src: string
  fallback: string
  fit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  alt: string
  silent?: boolean
  onLoad?: (e: Event) => void
}>

export default function Image (props: Partial<ImageProps>) {
  const [local] = splitProps(props, ['class', 'style', 'src', 'alt', 'fallback', 'fit', 'onClick', 'silent', 'onLoad'])
  const fallbackSrc = local.fallback ?? ''
  const [src, setSrc] = createSignal(local.silent ? '' : fallbackSrc)
  const [imgFit, setFit] = createSignal<ImageProps['fit']>('cover')
  const [targetSrc, setTargetSrc] = createSignal(local.src ?? '')

  let img: HTMLImageElement | undefined
  let loader: HTMLImageElement | undefined

  createEffect(on(() => local.src, v => load(v ?? '')))

  onMount(() => {
    function onLoad () {
      if (img?.src === targetSrc()) {
        img?.removeEventListener('load', onLoad)
        setFit(local.fit ?? 'contain')
      }
    }

    img?.addEventListener('load', onLoad)
  })

  function onLoad (e: Event) {
    if (loader) {
      loader.removeEventListener('load', onLoad)
      setSrc(loader.src)
    }
    local.onLoad?.(e)
  }

  function load (target: string) {
    loader?.removeEventListener('load', onLoad)
    loader = new window.Image()
    loader.addEventListener('load', onLoad)
    loader.src = target
    setTargetSrc(target)
  }

  return (
    <img
      ref={img}
      data-src={targetSrc()}
      class={classNames(local.class)}
      src={src()}
      alt={local.alt}
      onClick={local.onClick}
      style={{
        'object-fit': imgFit(),
        ...local.style,
      }}
    />
  )
}
