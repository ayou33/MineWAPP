import { TipOption } from '@/components/tips/Tips'
import { TipPosition, TipType } from '@/config'
import useTimer from '@/hooks/useTimer'
import classNames from 'classnames'
import { createSignal, ParentProps } from 'solid-js'

type TipProps = {
  option: TipOption;
  onComplete: () => void;
}

const SWIPE_THRESHOLD = 50
const ANIM_DURATION_FALLBACK = 300

function getTransitionDuration (): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--transition-duration').trim()
  return raw ? parseFloat(raw) : ANIM_DURATION_FALLBACK
}

export default function Tip ({ children, onComplete, option }: ParentProps<TipProps>) {
  const { delay } = useTimer()

  const isTop = option.position !== TipPosition.CENTER && option.position !== TipPosition.BOTTOM
  const isCenter = option.position === TipPosition.CENTER
  const isBottom = option.position === TipPosition.BOTTOM

  const [wrapperPosition, innerLayout] = isCenter
    ? [
      'inset-0 flex items-center justify-center pointer-events-none',
      'max-w-xs text-center pointer-events-auto',
    ]
    : isBottom
      ? [
        'bottom-0 inset-x-0 flex justify-center',
        'w-full text-center',
      ]
      : [
        'top-0 inset-x-0',
        'w-full',
      ] // top

  const background = option.type === TipType.SUCCESS
    ? 'bg-[#097897]/90'
    : option.type === TipType.ERROR
      ? 'bg-red-darker/90'
      : option.type === TipType.WARNING
        ? 'bg-orange-lighter/90'
        : 'bg-black/90' // info

  const animClass = isTop ? 'tip-slide-down' : isCenter ? 'tip-scale' : 'tip-slide-up'

  /* ── animation state ── */
  const [visible, setVisible] = createSignal(false)
  const [offsetY, setOffsetY] = createSignal(0)
  const [dragging, setDragging] = createSignal(false)
  let startY = 0
  let autoCloseTimer: number | undefined

  // trigger enter after first paint
  requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))

  const ANIM_DURATION = getTransitionDuration()

  function exit () {
    if (!visible()) return
    setVisible(false)
    delay(onComplete, ANIM_DURATION)
  }

  function startAutoClose () {
    if (option.autoClose) {
      stopAutoClose()
      autoCloseTimer = delay(exit, option.duration)
    }
  }

  function stopAutoClose () {
    if (autoCloseTimer !== undefined) {
      clearTimeout(autoCloseTimer)
      autoCloseTimer = undefined
    }
  }

  function springBack () {
    if (!dragging()) return
    setDragging(false)
    setOffsetY(0)
    startAutoClose()
  }

  function onPointerDown (e: PointerEvent) {
    if (!isTop) return
    startY = e.clientY
    setDragging(true)
    stopAutoClose()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove (e: PointerEvent) {
    if (!isTop || !dragging()) return
    e.preventDefault()
    setOffsetY(Math.min(0, e.clientY - startY))
  }

  function onPointerUp () {
    if (!isTop || !dragging()) return
    if (offsetY() < -SWIPE_THRESHOLD) {
      setDragging(false)
      exit()
    } else {
      springBack()
    }
  }

  startAutoClose()

  const swipeHandlers = isTop ? {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: springBack,
  } : {}

  /* ── computed styles (only swipe offset for top) ── */

  return <div
    class={classNames(
      'fixed p-4 z-system tip-anim',
      wrapperPosition,
      animClass,
      { 'touch-none': isTop, 'tip-visible': visible(), 'tip-anim--dragging': dragging() },
    )}
    style={isTop && offsetY() !== 0 ? { transform: `translateY(${offsetY()}px)` } : undefined}
    {...swipeHandlers}
  >
    <div class={classNames('text-white rounded-xl p-4 supports-[backdrop-filter]:backdrop-blur-sm', background, innerLayout)}>
      {children}
    </div>
  </div>
}
