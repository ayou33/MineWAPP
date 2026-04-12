import { For } from 'solid-js'
import Icon from '@/components/Icon'

const FOOTER_LINKS = [
  {
    heading: '服务',
    links: ['内容孵化', '流量运营', '商业变现', '数据分析', '版权保护'],
  },
  {
    heading: '关于我们',
    links: ['公司介绍', '发展历程', '团队成员', '新闻资讯', '加入我们'],
  },
  {
    heading: '支持',
    links: ['达人入驻', '品牌合作', '常见问题', '隐私政策', '服务协议'],
  },
]

const SOCIALS = [
  { icon: 'MessageCircle', label: '微信' },
  { icon: 'Globe', label: '官网' },
  { icon: 'Send', label: '微博' },
  { icon: 'Phone', label: '电话' },
]

export default function HomeFooter () {
  return (
    <footer class="bg-black text-white px-6 pt-14 pb-8">
      <div class="max-w-[1200px] mx-auto">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div class="col-span-2 sm:col-span-1">
            <div class="flex items-center gap-2 mb-4">
              <Icon name="Zap" size={20} color="#2E60F9" />
              <span class="text-base font-bold tracking-tight">MIMC MCN</span>
            </div>
            <p class="text-sm text-white/45 leading-relaxed mb-5">
              赋能每一位创作者，连接无限商业可能
            </p>
            <div class="flex gap-2.5">
              <For each={SOCIALS}>
                {(s) => (
                  <button
                    title={s.label}
                    class="flex items-center justify-center w-9 h-9 bg-white/[0.07] border border-white/10 rounded-xl text-white/50 cursor-pointer transition-all hover:bg-blue/15 hover:text-blue hover:border-blue/30 border-0"
                  >
                    <Icon name={s.icon} size={16} />
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Link columns */}
          <For each={FOOTER_LINKS}>
            {(col) => (
              <div>
                <div class="text-[13px] font-semibold text-white/80 mb-4 tracking-wide uppercase">{col.heading}</div>
                <ul class="list-none m-0 p-0 flex flex-col gap-2.5">
                  <For each={col.links}>
                    {(link) => (
                      <li>
                        <a href="#" class="text-sm text-white/40 no-underline cursor-pointer transition-colors hover:text-white/80">
                          {link}
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            )}
          </For>

        </div>

        <div class="border-t border-white/[0.07] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-white/30">
          <span>© 2025 MIMC MCN · 杭州迈克传媒有限公司</span>
          <span>粤ICP备XXXXXXXX号</span>
        </div>
      </div>
    </footer>
  )
}
