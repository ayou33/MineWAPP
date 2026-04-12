import { For } from 'solid-js'
import Icon from '@/components/Icon'
import { isDark, toggleTheme } from '@/hooks/useTheme'

const NAV_LINKS = [
  { label: '服务', href: '#services' },
  { label: '流程', href: '#process' },
  { label: '达人', href: '#creators' },
  { label: '联系', href: '#contact' },
]

export default function HomeNav () {
  return (
    <nav
      class="sticky top-0 z-10 backdrop-blur-2xl border-b border-[var(--c-nav-border)]"
      style={{ background: 'var(--c-nav-bg)', 'box-shadow': 'var(--c-nav-shadow)' }}
    >
      <div class="flex items-center gap-2 max-w-[1200px] mx-auto px-6 h-16">

        {/* Logo */}
        <a href="#" class="flex items-center gap-2 no-underline shrink-0 cursor-pointer">
          <Icon name="Zap" size={22} color="var(--md-primary)" />
          <span class="text-lg font-bold text-c-text tracking-tight">
            MIMC
            <span class="ml-1 px-1.5 py-px bg-blue text-white text-[11px] font-bold rounded-md align-middle leading-relaxed tracking-[0.5px]">
              MCN
            </span>
          </span>
        </a>

        {/* Desktop links */}
        <div class="hidden sm:flex items-center gap-1 ml-auto">
          <For each={NAV_LINKS}>
            {(link) => (
              <a
                href={link.href}
                class="px-3.5 py-1.5 text-sm font-medium text-c-nav-text rounded-[10px] no-underline hover:bg-[var(--state-hover)] hover:text-c-nav-text-active transition-colors cursor-pointer"
              >
                {link.label}
              </a>
            )}
          </For>
        </div>

        {/* Theme toggle — desktop */}
        <button
          onClick={(e) => toggleTheme(e)}
          title={isDark() ? '切换浅色模式' : '切换深色模式'}
          class="hidden sm:flex items-center justify-center w-9 h-9 rounded-[10px] text-c-nav-text border-0 bg-transparent cursor-pointer transition-all hover:bg-[var(--state-hover)] hover:text-c-nav-text-active"
        >
          <Icon name={isDark() ? 'Sun' : 'Moon'} size={18} />
        </button>

        {/* CTA */}
        <a
          href="/auth"
          class="hidden sm:flex items-center gap-1.5 ml-3 px-4 py-2 bg-c-btn-filled-bg text-c-btn-filled-text text-sm font-semibold rounded-xl no-underline transition-all shadow-[var(--c-btn-filled-shadow)] hover:bg-c-btn-filled-hover-bg hover:shadow-[0_4px_16px_rgba(46,96,249,0.4)] hover:-translate-y-px"
        >
          登录
          <Icon name="LogIn" size={15} />
        </a>

        {/* Mobile: theme toggle + menu */}
        <div class="flex sm:hidden items-center gap-1 ml-auto">
          <button
            onClick={(e) => toggleTheme(e)}
            title={isDark() ? '切换浅色模式' : '切换深色模式'}
            class="flex items-center justify-center w-9 h-9 text-c-nav-text bg-transparent border-0 rounded-[10px] cursor-pointer hover:bg-[var(--state-hover)]"
          >
            <Icon name={isDark() ? 'Sun' : 'Moon'} size={18} />
          </button>
          <button class="flex items-center justify-center w-9 h-9 text-c-text bg-transparent border-0 rounded-[10px] cursor-pointer hover:bg-[var(--state-hover)]">
            <Icon name="Menu" size={22} />
          </button>
        </div>

      </div>
    </nav>
  )
}
