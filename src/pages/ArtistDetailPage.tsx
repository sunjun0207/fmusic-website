import { CoverArt } from '../components/CoverArt'
import { EmptyState } from '../components/EmptyState'
import { SongTable } from '../components/SongTable'
import { getArtist, tracksOfArtist } from '../data/catalog'

export function ArtistDetailPage({ id }: { id: string }) {
  const artist = getArtist(id)
  if (!artist) {
    return <EmptyState title="没有这位歌手。" href="#/artists" action="返回歌手" />
  }
  const tracks = tracksOfArtist(artist.id)

  return (
    <>
      <div className="detail-head">
        <CoverArt cover={artist.cover} round />
        <div>
          <p className="kicker">{artist.region}</p>
          <h1>{artist.name}</h1>
          <p>{artist.blurb}</p>
          <p className="meta">{tracks.length} 首编辑曲目</p>
          <div className="detail-actions">
            <a className="btn btn-ghost" href="#/artists">
              返回歌手
            </a>
          </div>
        </div>
      </div>
      <SongTable tracks={tracks} />
    </>
  )
}
