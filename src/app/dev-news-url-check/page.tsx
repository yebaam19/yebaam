import { NewsComposer } from '@/features/news/components/NewsComposer'

export default function DevNewsUrlCheckPage() {
  return (
    <NewsComposer
      sections={[]}
      sources={[]}
      cities={[{ id: 'popayan', label: 'Popayán, Colombia' }]}
      eligible
      newsEnabled
      videosEnabled
    />
  )
}
