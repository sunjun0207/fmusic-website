import type { Album } from '../data/catalog'
import { CoverArt } from './CoverArt'

export function AlbumCard({ album }: { album: Album }) {
  return (
    <a className="album-card" href={`#/album/${album.id}`}>
      <CoverArt cover={album.cover} />
      <strong>{album.title}</strong>
      <span>
        {album.artist} · {album.year}
      </span>
    </a>
  )
}
