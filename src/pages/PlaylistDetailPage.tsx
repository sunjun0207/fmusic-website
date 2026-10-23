import { CoverArt } from '../components/CoverArt'
import { EmptyState } from '../components/EmptyState'
import { SongTable } from '../components/SongTable'
import { EDITORIAL_NOTE, getPlaylist, getTracks } from '../data/catalog'

export function PlaylistDetailPage({ id }: { id: string }) {
  const playlist = getPlaylist(id)
  if (!playlist) {
    return <EmptyState title="没有这张歌单。" href="#/playlists" action="返回歌单" />
  }
  const tracks = getTracks(playlist.trackIds)

  return (
    <>
      <div className="detail-head">
        <CoverArt cover={playlist.cover} />
        <div>
          <p className="kicker">歌单</p>
          <h1>{playlist.title}</h1>
          <p>{playlist.desc}</p>
          <p className="tags">
            {playlist.tags.map((tag) => (
              <a key={tag} className="tag" href={`#/playlists?tag=${encodeURIComponent(tag)}`}>
                {tag}
              </a>
            ))}
          </p>
          <p className="meta">
            编辑于 {playlist.updated} · {tracks.length} 首
          </p>
          <div className="detail-actions">
            <a className="btn btn-ghost" href="#/playlists">
              返回歌单
            </a>
          </div>
        </div>
      </div>
      <SongTable tracks={tracks} />
      <p className="note">{EDITORIAL_NOTE}</p>
    </>
  )
}
