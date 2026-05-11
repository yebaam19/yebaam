import Header from '@/components/Header/Header'
import { PlayerBar } from '@/features/music-archive/components/PlayerBar'
import { MusicMediaLightbox } from '@/features/music-archive/components/media/MusicMediaLightbox'
import { MusicMediaMiniPlayer } from '@/features/music-archive/components/media/MusicMediaMiniPlayer'
import { ApplicationLayout } from './application-layout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ApplicationLayout header={<Header hasBorderBottom={false} />}>
      {children}
      <PlayerBar />
      <MusicMediaLightbox />
      <MusicMediaMiniPlayer />
    </ApplicationLayout>
  )
}
