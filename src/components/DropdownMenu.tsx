import classNames from 'classnames'
import {
  Accessor, createEffect, createSignal, For, JSX, onCleanup, Show, splitProps,
} from 'solid-js'
import { Portal } from 'solid-js/web'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DropdownActionItem = {
  type?: 'item'
  label: string
  icon?: JSX.Element
  description?: string
  onClick?: (e: MouseEvent) => void
  danger?: boolean
  disabled?: boolean
}

export type DropdownDividerItem = { type: 'divider' }

export type DropdownItem = DropdownActionItem | DropdownDividerItem

type PanelPos = {
  top: number
  left: number
  width: number
  /** transform-origin y — trigger's vertical centre mapped into the panel coordinate space */
  originY: number
}

type Props = {
  items: DropdownItem[]
  /**
   * Custom content rendered at the very top of the panel.
   * Visually "fuses" with the trigger: the panel overlays the trigger so
   * this header row sits exactly where the trigger button was.
   */
  header?: JSX.Element
  /** Minimum panel width. Defaults to max(triggerWidth, 200). */
  minWidth?: number
  /** Which edge of the trigger to align. Default: 'right'. */
  align?: 'left' | 'right'
  class?: string
  /**
   * Render-prop trigger — receives a reactive `open` accessor so the
   * trigger can adapt its appearance (rotate chevron, change bg, etc.).
   */
  children: (open: Accessor<boolean>) => JSX.Element
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CLOSE_DELAY = 220 // ms — must be > CSS transition duration below
const VGAP = 8 // min margin from viewport edges
const DEFAULT_MIN_WIDTH = 200
const MAX_PANEL_HEIGHT = 400

// ── Component ─────────────────────────────────────────────────────────────────

export default function DropdownMenu (rawProps: Props) {
  const [p] = splitProps(rawProps, ['items', 'header', 'minWidth', 'align', 'class', 'children'])

  let wrapperEl: HTMLDivElement | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined

  const [mounted, setMounted] = createSignal(false)
  const [visible, setVisible] = createSignal(false)
  const [pos, setPos] = createSignal<PanelPos>({ top: 0, left: 0, width: DEFAULT_MIN_WIDTH, originY: 0 })

  // Trigger is resolved once; it receives the reactive `mounted` signal so it
  // can change its own appearance when the menu is open / closed.
  const trigger = p.children(mounted)

  // ── Position ──────────────────────────────────────────────────────────────

  function calcPos (): PanelPos {
    const rect = wrapperEl!.getBoundingClientRect()
    const minW = Math.max(rect.width, p.minWidth ?? DEFAULT_MIN_WIDTH)

    // Panel overlays the trigger: top of panel = top of trigger.
    // This makes the header row sit exactly where the trigger button was.
    const top = Math.max(VGAP, Math.min(rect.top, window.innerHeight - MAX_PANEL_HEIGHT - VGAP))
    const left = (p.align ?? 'right') === 'right'
      ? Math.max(VGAP, rect.right - minW)
      : Math.min(rect.left, window.innerWidth - minW - VGAP)

    // originY: trigger's vertical centre mapped into the panel's local space.
    const originY = (rect.top - top) + rect.height / 2

    return { top, left, width: minW, originY }
  }

  // ── Open / Close ──────────────────────────────────────────────────────────

  function openMenu () {
    if (mounted()) return
    clearTimeout(closeTimer)
    setPos(calcPos())
    setMounted(true)
    // Double-RAF: let the panel mount into the DOM before the CSS transition
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
  }

  function closeMenu () {
    if (!mounted()) return
    setVisible(false)
    closeTimer = setTimeout(() => setMounted(false), CLOSE_DELAY)
  }

  function pick (item: DropdownActionItem, e: MouseEvent) {
    if (item.disabled) return
    item.onClick?.(e)
    closeMenu()
  }

  onCleanup(() => clearTimeout(closeTimer))

  // Close on Escape while the panel is open
  createEffect(() => {
    if (!mounted()) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); closeMenu() } }
    document.addEventListener('keydown', onKey)
    onCleanup(() => document.removeEventListener('keydown', onKey))
  })

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Trigger wrapper — delegates click to openMenu */}
      <div
        ref={el => { wrapperEl = el }}
        class={classNames('inline-flex', p.class)}
        onClick={openMenu}
      >
        {trigger}
      </div>

      {/* ── Portal ── */}
      <Show when={mounted()}>
        <Portal mount={document.body}>

          {/* Transparent backdrop — closes the panel on outside click */}
          <div class="fixed inset-0" style={{ 'z-index': 'var(--z-index-dropdown)' }} onClick={closeMenu} />

          {/* Panel */}
          <div
            class={classNames(
              'dropdown-menu-panel fixed',
              visible() && 'dropdown-menu-panel--visible',
            )}
            style={{
              top:                `${pos().top}px`,
              left:               `${pos().left}px`,
              width:              `${pos().width}px`,
              'transform-origin': `center ${pos().originY}px`,
              'z-index':          'calc(var(--z-index-dropdown) + 1)',
              'pointer-events':   visible() ? 'auto' : 'none',
            }}
          >

            {/* Integrated header — sits at the trigger's visual position */}
            <Show when={p.header}>
              <div class="border-b border-c-divider">
                {p.header}
              </div>
            </Show>

            {/* Menu items */}
            <ul role="menu" class="py-1.5">
              <For each={p.items}>
                {(item) => {
                  if (item.type === 'divider') {
                    return <li class="h-px mx-3 my-1.5 bg-[var(--c-divider)]" role="separator" />
                  }
                  const it = item as DropdownActionItem
                  return (
                    <li
                      role="menuitem"
                      aria-disabled={it.disabled}
                      class={classNames(
                        'flex items-center gap-3 px-3 mx-1.5 h-10 rounded-lg',
                        'text-sm transition-colors duration-100 select-none',
                        it.disabled
                          ? 'opacity-40 cursor-not-allowed text-c-text-muted'
                          : it.danger
                            ? 'cursor-pointer text-md-error hover:bg-[rgba(246,77,75,0.10)]'
                            : 'cursor-pointer text-c-text hover:bg-c-menu-item-hover',
                      )}
                      onClick={(e) => pick(it, e)}
                    >
                      <Show when={it.icon}>
                        <span class="shrink-0 flex items-center opacity-70">{it.icon}</span>
                      </Show>
                      <span class="flex-1 truncate">{it.label}</span>
                      <Show when={it.description}>
                        <span class="text-xs text-c-text-subtle ml-auto shrink-0">{it.description}</span>
                      </Show>
                    </li>
                  )
                }}
              </For>
            </ul>

          </div>
        </Portal>
      </Show>
    </>
  )
}
