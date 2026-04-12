import { For } from 'solid-js'
import SectionHeader from './SectionHeader'
import Icon from '@/components/Icon'

const STEPS = [
  { icon: 'FileCheck', title: '提交申请', desc: '填写基本资料，完成初步资质审核' },
  { icon: 'MessageCircle', title: '顾问沟通', desc: '专属顾问深度沟通，制定成长方案' },
  { icon: 'Target', title: '签约合作', desc: '完成协议签订，正式进入 MCN 生态' },
  { icon: 'Rocket', title: '起飞成长', desc: '全方位赋能支持，加速粉丝与收益增长' },
]

export default function HomeProcess () {
  return (
    <section
      id="process"
      class="py-20 px-6"
      style={{ background: 'linear-gradient(135deg, var(--md-surface-1) 0%, var(--md-surface-2) 100%)' }}
    >
      <div class="max-w-[1200px] mx-auto">
        <SectionHeader
          tag="入驻流程"
          title="四步轻松成为 MCN 签约达人"
          desc="简单快速的入驻体验，让每一位创作者都能顺利开启职业化内容之路"
        />
        <div class="flex flex-col sm:flex-row items-start gap-4">
          <For each={STEPS}>
            {(step, i) => (
              <>
                <div class="flex-1 flex flex-col items-center text-center bg-c-surface rounded-[20px] p-7 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-[220ms] hover:shadow-[0_4px_8px_rgba(0,0,0,0.08),0_12px_28px_rgba(46,96,249,0.1)] hover:-translate-y-1">
                  <div class="relative mb-4">
                    <div class="flex items-center justify-center w-14 h-14 bg-md-primary/8 rounded-[18px] mb-1">
                      <Icon name={step.icon} size={26} color="var(--md-primary)" />
                    </div>
                    <span class="absolute -top-1 -right-1 w-5 h-5 bg-blue text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                      {i() + 1}
                    </span>
                  </div>
                  <div class="text-[15px] font-bold text-c-text mb-1.5">{step.title}</div>
                  <p class="text-sm text-c-text-muted leading-relaxed m-0">{step.desc}</p>
                </div>
                {i() < STEPS.length - 1 && (
                  <div class="hidden sm:flex items-center self-center text-c-text-subtle -mx-1 shrink-0 mt-0">
                    <Icon name="ChevronRight" size={24} />
                  </div>
                )}
              </>
            )}
          </For>
        </div>
      </div>
    </section>
  )
}
