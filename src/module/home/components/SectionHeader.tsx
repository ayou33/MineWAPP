type Props = { tag: string; title: string; desc: string }

export default function SectionHeader (props: Props) {
  return (
    <div class="text-center mb-12">
      <span class="inline-flex items-center px-3.5 py-1 bg-blue/8 text-blue text-[13px] font-semibold rounded-full mb-3.5 tracking-[0.3px]">
        {props.tag}
      </span>
      <h2 class="text-[clamp(1.5rem,3vw,2.125rem)] font-extrabold text-c-text tracking-tight mt-0 mb-3">
        {props.title}
      </h2>
      <p class="text-base text-c-text-muted leading-relaxed mt-0 max-w-[540px] mx-auto">
        {props.desc}
      </p>
    </div>
  )
}
