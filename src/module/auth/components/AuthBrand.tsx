import Icon from '@/components/Icon'
import { For } from 'solid-js'

const FEATURES = [
  {
    icon: 'TrendingUp',
    title: '全链路数据洞察',
    desc: '实时监控多平台创作者表现，精准把握流量脉搏',
  },
  {
    icon: 'Users',
    title: '达人矩阵管理',
    desc: '智能分级管理海量创作者，高效协同签约运营',
  },
  {
    icon: 'Zap',
    title: '智能变现引擎',
    desc: '一键对接广告、直播、电商多元变现路径',
  },
]

export default function AuthBrand () {
  return (
    <div
      class="relative flex flex-col w-full overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #0A1628 0%, #1C2E60 55%, #0A1628 100%)' }}
    >
      {/* Decorative orbs */}
      <div
        class="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #2E60F9 0%, transparent 70%)' }}
      />
      <div
        class="absolute bottom-[-60px] right-[-60px] w-[320px] h-[320px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #9600D2 0%, transparent 70%)' }}
      />

      <div class="relative z-10 flex flex-col h-full px-12 py-16">
        {/* Logo */}
        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'rgba(46,96,249,0.25)', border: '1px solid rgba(175,198,255,0.2)' }}
          >
            <Icon name="Zap" size={22} color="#AFC6FF" />
          </div>
          <div>
            <span class="text-xl font-bold text-white tracking-tight">MIMC</span>
            <span
              class="ml-2 px-1.5 py-px text-[11px] font-bold rounded-md align-middle leading-relaxed tracking-[0.5px]"
              style={{ background: 'rgba(46,96,249,0.5)', color: '#AFC6FF' }}
            >
              MCN
            </span>
          </div>
        </div>

        {/* Headline */}
        <div class="mt-16 mb-12">
          <h2 class="text-[2.2rem] font-bold text-white leading-tight mb-4">
            新一代 MCN<br />
            <span style={{ color: '#AFC6FF' }}>智能管理平台</span>
          </h2>
          <p class="text-base leading-relaxed" style={{ color: 'rgba(175,198,255,0.65)' }}>
            整合创作者资源，驱动内容商业化增长
          </p>
        </div>

        {/* Feature list */}
        <div class="flex flex-col gap-6">
          <For each={FEATURES}>
            {(f) => (
              <div class="flex items-start gap-4">
                <div
                  class="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                  style={{ background: 'rgba(46,96,249,0.2)', border: '1px solid rgba(175,198,255,0.15)' }}
                >
                  <Icon name={f.icon as Parameters<typeof Icon>[0]['name']} size={18} color="#AFC6FF" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                  <p class="text-xs leading-relaxed" style={{ color: 'rgba(175,198,255,0.55)' }}>{f.desc}</p>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* Bottom tagline */}
        <p class="text-xs mt-auto pt-12" style={{ color: 'rgba(175,198,255,0.35)' }}>
          © 2025 MIMC MCN Platform. All rights reserved.
        </p>
      </div>
    </div>
  )
}
