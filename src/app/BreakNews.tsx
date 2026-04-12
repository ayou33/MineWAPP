import { createSignal, Show } from 'solid-js'

export default function BreakNews () {
  const [news] = createSignal('')

  // Simulate fetching breaking news
  return (
    <Show when={news()}>
      <div class="bg-red-100 text-red-800 px-4 py-2 text-center">
        <strong>Breaking News:</strong> This is a sample breaking news banner. Stay tuned for updates!
      </div>
    </Show>
  )
}