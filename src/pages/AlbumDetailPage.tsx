import { CoverArt } from '../components/CoverArt'
import { EmptyState } from '../components/EmptyState'
import { SongTable } from '../components/SongTable'
import { EDITORIAL_NOTE, getAlbum, getTracks } from '../data/catalog'

export function AlbumDetailPage({ id }: { id: string }) {
  const album = getAlbum(id)
  if (!album) {
    return <EmptyState title="没有这张专辑。" href="#/albums" action="返回新碟" />
  }
  const tracks = getTracks(album.trackIds)

  return (
    <>
      <div className="detail-head">
        <CoverArt cover={album.cover} />
        <div>
          <p className="kicker">专辑 · {album.year}</p>
          <h1>{album.title}</h1>
          <p>
            <a href={`#/artist/${album.artistId}`}>{album.artist}</a>
          </p>
          <p>{album.desc}</p>
          <p className="meta">{tracks.length} 首</p>
          <div className="detail-actions">
            <a className="btn btn-ghost" href="#/albums">
              返回新碟
            </a>
          </div>
        </div>
      </div>
      <SongTable tracks={tracks} />
      <p className="note">{EDITORIAL_NOTE}</p>
    </>
  )
}
