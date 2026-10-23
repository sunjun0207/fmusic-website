import { useEffect } from 'react'
import { PlayerProvider } from './components/PlayerProvider'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { SubNav } from './components/SubNav'
import { documentTitle } from './lib/title'
import { useRoute } from './lib/route'
import { AboutPage } from './pages/AboutPage'
import { AlbumDetailPage } from './pages/AlbumDetailPage'
import { AlbumsPage } from './pages/AlbumsPage'
import { ArtistDetailPage } from './pages/ArtistDetailPage'
import { ArtistsPage } from './pages/ArtistsPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { DownloadPage } from './pages/DownloadPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlaylistDetailPage } from './pages/PlaylistDetailPage'
import { PlaylistsPage } from './pages/PlaylistsPage'
import { SearchPage } from './pages/SearchPage'
import { ToplistPage } from './pages/ToplistPage'

export default function App() {
  const route = useRoute()

  useEffect(() => {
    document.title = documentTitle(route)
    window.scrollTo(0, 0)
  }, [route])

  return (
    <PlayerProvider>
      <a className="skip" href="#main">
        跳到内容
      </a>
      <div className="sticky-top">
        <SiteHeader route={route} />
        <SubNav route={route} />
      </div>
      <main id="main" className="wrap page">
        {route.name === 'discover' && <DiscoverPage />}
        {route.name === 'toplist' && <ToplistPage id={route.id} />}
        {route.name === 'playlists' && <PlaylistsPage tag={route.tag} />}
        {route.name === 'playlist' && <PlaylistDetailPage id={route.id || ''} />}
        {route.name === 'artists' && <ArtistsPage tag={route.tag} />}
        {route.name === 'artist' && <ArtistDetailPage id={route.id || ''} />}
        {route.name === 'albums' && <AlbumsPage />}
        {route.name === 'album' && <AlbumDetailPage id={route.id || ''} />}
        {route.name === 'download' && <DownloadPage />}
        {route.name === 'about' && <AboutPage />}
        {route.name === 'search' && <SearchPage q={route.q} page={route.page} />}
        {route.name === 'notfound' && <NotFoundPage />}
      </main>
      <SiteFooter />
    </PlayerProvider>
  )
}
