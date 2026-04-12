import Icon from '@/components/Icon'

const PLATFORMS = ['抖音', '小红书', 'B站', '快手', '微博']

function FloatCard (props: { cls: string; icon: string; color: string; label: string; value: string }) {
  return (
    <div
      class={`absolute flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${props.cls}`}
      style={{ background: 'rgba(255,255,255,0.07)', 'backdrop-filter': 'blur(12px)' }}
    >
      <div class="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: `${props.color}22` }}>
        <Icon name={props.icon} size={16} color={props.color} />
      </div>
      <div>
        <div class="text-white/50 text-[11px] leading-none mb-0.5">{props.label}</div>
        <div class="text-white font-bold text-sm leading-none">{props.value}</div>
      </div>
    </div>
  )
}

export default function HomeHero () {
  return (
    <section
      class="relative min-h-[84vh] flex flex-col items-center justify-center text-center overflow-hidden px-6 pb-16 pt-24"
      style={{ background: 'linear-gradient(160deg, #050e2a 0%, #091840 40%, #0a2060 70%, #0d2878 100%)' }}
    >
      {/* Radial glow layers */}
      <div class="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(46,96,249,0.32) 0%, transparent 65%)' }} />
      <div class="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 80% 60%, rgba(150,0,210,0.18) 0%, transparent 60%)' }} />

      {/* Pulse orbit rings */}
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] pointer-events-none">
        <div class="animate-pulse-ring absolute inset-0 rounded-full border border-blue/25" />
        <div class="animate-pulse-ring-delayed absolute inset-[48px] rounded-full border border-blue/15" />
      </div>

      {/* Float cards — anchored to content max-width */}
      <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] pointer-events-none">
        <FloatCard cls="top-[18%] left-[2%] animate-float-1" icon="TrendingUp" color="#00C58A" label="月度增长" value="+38%" />
        <FloatCard cls="top-[20%] right-[2%] animate-float-2" icon="Play" color="#2E60F9" label="总播放量" value="50亿+" />
        <FloatCard cls="bottom-[30%] left-[2%] animate-float-3" icon="Award" color="#FF9100" label="行业奖项" value="26项" />
      </div>

      {/* Hero text */}
      <div class="relative z-[1] max-w-[720px]">
        <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-white/20 rounded-full text-white/70 text-[13px] mb-6 tracking-wide"
          style={{ background: 'rgba(46,96,249,0.15)' }}>
          <Icon name="Sparkles" size={13} color="#7098F8" />
          中国领先 MCN 机构
        </div>

        <h1
          class="text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.12] tracking-tight mb-5"
          style="-webkit-background-clip:text;-webkit-text-fill-color:transparent;background:linear-gradient(135deg,#fff 0%,#c5d4ff 60%,#517bff 100%);background-clip:text"
        >
          释放创作力量<br />连接商业未来
        </h1>

        <p class="text-base text-white/60 leading-[1.7] max-w-[520px] mx-auto mb-9">
          MIMC MCN 汇聚全平台优质达人，提供从内容孵化、流量运营到商业变现的一站式服务
        </p>

        <div class="flex gap-3 justify-center flex-wrap mb-10">
          <button class="flex items-center gap-2 px-7 py-3.5 bg-blue text-white text-[15px] font-semibold rounded-[14px] border-0 cursor-pointer transition-all shadow-[0_4px_24px_rgba(46,96,249,0.55)] hover:bg-blue-darker hover:-translate-y-px hover:shadow-[0_6px_32px_rgba(46,96,249,0.7)]">
            免费申请入驻
            <Icon name="ArrowRight" size={18} />
          </button>
          <button class="flex items-center gap-2 px-6 py-3.5 bg-white/[0.06] text-white text-[15px] font-medium rounded-[14px] border border-white/20 cursor-pointer transition-all hover:bg-white/10">
            <Icon name="Play" size={16} />
            了解更多
          </button>
        </div>

        {/* Platform chips */}
        <div class="flex items-center justify-center gap-2 flex-wrap">
          <span class="text-white/35 text-xs">覆盖平台</span>
          {PLATFORMS.map(p => (
            <span class="px-2.5 py-1 bg-white/[0.06] border border-white/10 text-white/60 text-xs rounded-full">{p}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
