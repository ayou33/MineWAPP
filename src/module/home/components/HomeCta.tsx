import Icon from '@/components/Icon'

export default function HomeCta () {
  return (
    <section
      id="contact"
      class="relative overflow-hidden px-6 py-20 text-center"
      style={{ background: 'linear-gradient(135deg, #071433 0%, #0d2157 50%, #112875 100%)' }}
    >
      <div
        class="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(46,96,249,0.3) 0%, transparent 70%)' }}
      />

      <div class="relative z-[1] max-w-[640px] mx-auto">
        <div class="inline-flex items-center justify-center w-[72px] h-[72px] bg-white/10 border border-white/15 rounded-[22px] mb-6">
          <Icon name="Rocket" size={32} color="white" />
        </div>

        <h2 class="text-[clamp(1.5rem,3vw,2rem)] font-extrabold text-white tracking-tight mt-0 mb-3.5">
          准备好开启创作新旅程了吗？
        </h2>
        <p class="text-base text-white/60 leading-[1.65] mt-0 mb-9">
          立即加入 MIMC MCN，获取专属成长顾问服务，让您的创作价值得到充分释放
        </p>

        <div class="flex gap-3 justify-center flex-wrap">
          <button class="flex items-center gap-2 px-7 py-3 bg-blue text-white text-[15px] font-semibold rounded-[14px] border-0 cursor-pointer transition-all shadow-[0_4px_20px_rgba(46,96,249,0.5)] hover:bg-blue-darker hover:shadow-[0_6px_28px_rgba(46,96,249,0.65)] hover:-translate-y-0.5">
            立即申请入驻
            <Icon name="ArrowRight" size={18} />
          </button>
          <button class="flex items-center gap-2 px-6 py-3 bg-white/[0.07] text-white text-[15px] font-medium rounded-[14px] border border-white/20 cursor-pointer transition-all hover:bg-white/[0.12]">
            <Icon name="MessageCircle" size={18} />
            联系商务顾问
          </button>
        </div>
      </div>
    </section>
  )
}
