import { For } from 'solid-js'
import Icon from '@/components/Icon'

const STATS = [
  { value: '1,000+', label: '签约创作者', icon: 'Users' },
  { value: '50亿+', label: '月均播放量', icon: 'TrendingUp' },
  { value: '200+', label: '合作品牌', icon: 'Handshake' },
  { value: '15亿+', label: '粉丝总量', icon: 'Star' },
]

export default function HomeStats () {
  return (
    <div class="px-6 -mt-11 relative z-[2]">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-[1200px] mx-auto">
        <For each={STATS}>
          {(s) => (
            <div class="flex flex-col items-center gap-1.5 py-6 px-4 bg-c-surface rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-[220ms] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-[3px]">
              <div class="flex items-center justify-center w-11 h-11 bg-md-primary/8 rounded-xl mb-1">
                <Icon name={s.icon} size={20} color="var(--md-primary)" />
              </div>
              <div class="text-[1.625rem] font-extrabold text-c-text tracking-tight">{s.value}</div>
              <div class="text-sm text-c-text-muted font-medium">{s.label}</div>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
