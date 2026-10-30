import { useLayoutEffect } from 'react'
import { PlayerProvider } from './components/PlayerProvider'
import { PlaylistPicker } from './components/PlaylistPicker'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { ToastHost } from './components/ToastHost'
import { useRoute, type Route } from './lib/route'
import { documentTitle } from './lib/title'
import { AboutPage } from './pages/AboutPage'
import { AlbumDetailPage } from './pages/AlbumDetailPage'
import { AlbumsPage } from './pages/AlbumsPage'
import { ArtistDetailPage } from './pages/ArtistDetailPage'
import { ArtistsPage } from './pages/ArtistsPage'
import { CommunityPage } from './pages/CommunityPage'
import { DailyPage } from './pages/DailyPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { DownloadPage } from './pages/DownloadPage'
import { HomePage } from './pages/HomePage'
import { MinePage } from './pages/MinePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlaylistDetailPage } from './pages/PlaylistDetailPage'
import { PlaylistsPage } from './pages/PlaylistsPage'
import { RadioPage } from './pages/RadioPage'
import { SearchPage } from './pages/SearchPage'
import { SongPage } from './pages/SongPage'
import { ToplistPage } from './pages/ToplistPage'
import { VipPage } from './pages/VipPage'

function Page({ route }: { route: Route }) {
  const id = route.id ?? ''
  switch (route.name) {
    case 'home':
      return <HomePage />
    case 'discover':
      return <DiscoverPage />
    case 'daily':
      return <DailyPage />
    case 'toplist':
      return <ToplistPage id={route.id} />
    case 'playlists':
      return <PlaylistsPage params={route.params} page={route.page} />
    case 'playlist':
      return <PlaylistDetailPage key={id} id={id} />
    case 'artists':
      return <ArtistsPage params={route.params} page={route.page} />
    case 'artist':
      return <ArtistDetailPage key={id} id={id} params={route.params} page={route.page} />
    case 'albums':
      return <AlbumsPage page={route.page} />
    case 'album':
      return <AlbumDetailPage key={id} id={id} />
    case 'song':
      return <SongPage key={id} id={id} />
    case 'radio':
      return <RadioPage />
    case 'community':
      return <CommunityPage />
    case 'vip':
      return <VipPage />
    case 'mine':
      return <MinePage params={route.params} />
    case 'download':
      return <DownloadPage />
    case 'about':
      return <AboutPage />
    case 'search':
      return <SearchPage q={route.q} page={route.page} />
    default:
      return <NotFoundPage />
  }
}

export default function App() {
  const route = useRoute()

  useLayoutEffect(() => {
    document.title = documentTitle(route)
    window.scrollTo(0, 0)
  }, [route])

  return (
    <PlayerProvider>
      <a
        className="skip"
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        跳到内容
      </a>
      <div className="sticky-top">
        <SiteHeader route={route} />
      </div>
      <main id="main" tabIndex={-1} className={route.name === 'home' ? 'page is-home' : 'wrap page'}>
        <Page route={route} />
      </main>
      <SiteFooter />
      <PlaylistPicker />
      <ToastHost />
    </PlayerProvider>
  )
}
