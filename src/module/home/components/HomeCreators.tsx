import { For } from 'solid-js'
import SectionHeader from './SectionHeader'
import Icon from '@/components/Icon'

const CREATORS = [
  { name: '晴天美食', category: '美食探店', fans: '520万', posts: '1,200+', color: '#FF9100', icon: 'Utensils' },
  { name: '科技前沿', category: '数码评测', fans: '380万', posts: '860+', color: '#2E60F9', icon: 'Cpu' },
  { name: '小鹿生活志', category: '生活方式', fans: '290万', posts: '1,050+', color: '#00C58A', icon: 'Leaf' },
  { name: '游戏狂潮', category: '游戏娱乐', fans: '710万', posts: '2,300+', color: '#9600D2', icon: 'Gamepad2' },
]

export default function HomeCreators () {
  return (
    <section id="creators" class="py-20 px-6 bg-c-bg">
      <div class="max-w-[1200px] mx-auto">
        <SectionHeader
          tag="签约达人"
          title="与优质创作者共创价值"
          desc="多垂类头部达人矩阵，覆盖美食、科技、生活、游戏等高热赛道"
        />
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <For each={CREATORS}>
            {(c) => (
              <div class="group flex flex-col items-center text-center pt-8 pb-6 px-5 bg-c-surface rounded-[22px] border border-c-outline/25 transition-all duration-[220ms] hover:shadow-[0_4px_8px_rgba(0,0,0,0.07),0_12px_32px_rgba(0,0,0,0.09)] hover:-translate-y-1 cursor-pointer">
                <div
                  class="flex items-center justify-center w-[72px] h-[72px] rounded-[22px] mb-4 transition-transform duration-[220ms] group-hover:scale-105"
                  style={{ background: `${c.color}1A` }}
                >
                  <Icon name={c.icon} size={32} color={c.color} />
                </div>
                <div class="text-[15px] font-bold text-c-text mb-1">{c.name}</div>
                <div class="text-xs text-c-text-muted mb-4 px-2.5 py-0.5 bg-c-chip-bg/50 rounded-full">{c.category}</div>
                <div class="flex w-full justify-around border-t border-c-outline/25 pt-4 mt-auto">
                  <div>
                    <div class="text-[15px] font-extrabold text-c-text">{c.fans}</div>
                    <div class="text-[11px] text-c-text-muted mt-0.5">粉丝</div>
                  </div>
                  <div class="w-px bg-c-divider/40" />
                  <div>
                    <div class="text-[15px] font-extrabold text-c-text">{c.posts}</div>
                    <div class="text-[11px] text-c-text-muted mt-0.5">作品</div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
        <div class="flex justify-center mt-10">
          <button class="flex items-center gap-2 px-6 py-2.5 bg-c-bg text-c-nav-text-active text-[15px] font-semibold rounded-[14px] border border-c-outline/40 cursor-pointer transition-all hover:bg-[var(--state-hover)]">
            查看更多达人
            <Icon name="ArrowRight" size={17} />
          </button>
        </div>
      </div>
    </section>
  )
}
