import { For } from 'solid-js'
import SectionHeader from './SectionHeader'
import Icon from '@/components/Icon'

const SERVICES = [
  { icon: 'Video', title: '内容孵化', desc: '专业内容策划团队，从选题到剧本全程陪伴，打造爆款内容方法论', color: '#2E60F9' },
  { icon: 'TrendingUp', title: '流量运营', desc: '数据驱动的精准推广策略，多平台协同放大内容声量与传播效率', color: '#9600D2' },
  { icon: 'ShoppingBag', title: '商业变现', desc: '对接500+品牌资源，提供带货、广告、合作等多元变现通路', color: '#FF9100' },
  { icon: 'ChartBar', title: '数据分析', desc: '全链路数据监控与归因分析，实时洞察账号成长与内容表现', color: '#00C58A' },
  { icon: 'ShieldCheck', title: '版权保护', desc: '内容版权登记与平台侵权维权一站式处理，保障创作成果安全', color: '#F64D4B' },
  { icon: 'Globe', title: '出海推广', desc: '助力优质内容走向海外市场，接入跨境品牌合作与海外变现生态', color: '#517BFF' },
]

export default function HomeServices () {
  return (
    <section id="services" class="py-20 px-6 bg-c-surface">
      <div class="max-w-[1200px] mx-auto">
        <SectionHeader
          tag="核心服务"
          title="为创作者提供全链路支持"
          desc="从内容诞生到商业落地，我们提供覆盖创作全周期的专业服务体系"
        />
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <For each={SERVICES}>
            {(s) => (
              <div
                class="group flex flex-col gap-4 p-6 bg-c-bg rounded-[20px] border border-c-outline/30 transition-all duration-[220ms] hover:bg-c-surface hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.09)] hover:-translate-y-1 cursor-pointer"
              >
                <div
                  class="flex items-center justify-center w-12 h-12 rounded-[14px] transition-transform duration-[220ms] group-hover:scale-110"
                  style={{ background: `${s.color}18` }}
                >
                  <Icon name={s.icon} size={22} color={s.color} />
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-1.5">
                    <span class="text-[15px] font-bold text-c-text">{s.title}</span>
                    <Icon name="ChevronRight" size={15} color="var(--c-text-disabled)" />
                  </div>
                  <p class="text-sm text-c-text-muted leading-relaxed m-0">{s.desc}</p>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  )
}
