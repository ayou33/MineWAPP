import Spin from '@/components/Spin'

interface Props {
  text?: string
}

/** Inline data-loading indicator. Use as `<Show fallback={<DataLoading />}>` when an API call is in progress. */
export default function DataLoading (props: Props) {
  return (
    <div class="flex items-center justify-center py-16 gap-3">
      <Spin class="text-md-primary" />
      <span class="text-sm text-c-text-muted">{props.text ?? '加载中...'}</span>
    </div>
  )
}
