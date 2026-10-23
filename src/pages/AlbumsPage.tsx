import { AlbumCard } from '../components/AlbumCard'
import { albums } from '../data/catalog'

export function AlbumsPage() {
  return (
    <>
      <header className="page-intro">
        <h1>新碟上架</h1>
        <p>按专辑把歌收在一起。点进去可以看编辑列出的曲目。</p>
      </header>
      <div className="album-grid">
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </>
  )
}
