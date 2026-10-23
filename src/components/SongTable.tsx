import { usePlayer } from './PlayerProvider'
import { getAlbum } from '../data/catalog'
import type { Track } from '../data/catalog'

type Props = {
  tracks: Track[]
  linkTitle?: boolean
}

export function SongTable({ tracks, linkTitle = true }: Props) {
  const { playNamed, warmNamed, pending } = usePlayer()

  return (
    <div className="table-wrap">
      <table className="song-table">
        <colgroup>
          <col className="col-index" />
          <col />
          <col className="col-artist" />
          <col className="col-album hide-sm" />
          <col className="col-action" />
        </colgroup>
        <thead>
          <tr>
            <th>序号</th>
            <th>歌曲</th>
            <th>歌手</th>
            <th className="hide-sm">专辑</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, index) => {
            const album = track.albumId ? getAlbum(track.albumId) : undefined
            const query = `${track.title} ${track.artist}`
            return (
              <tr key={track.id}>
                <td className={index < 3 ? 'index top' : 'index'}>{index + 1}</td>
                <td>
                  {linkTitle ? <a href={`#/search?q=${encodeURIComponent(query)}`}>{track.title}</a> : track.title}
                </td>
                <td>
                  <a href={`#/artist/${track.artistId}`}>{track.artist}</a>
                </td>
                <td className="hide-sm">
                  {track.album ? (
                    album ? (
                      <a href={`#/album/${album.id}`}>{track.album}</a>
                    ) : (
                      track.album
                    )
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="text-btn"
                      disabled={pending}
                      onPointerDown={() => warmNamed(track.title, track.artist, 'audio')}
                      onClick={() => playNamed(track.title, track.artist, 'audio')}
                    >
                      播放歌曲
                    </button>
                    <button
                      type="button"
                      className="text-btn"
                      disabled={pending}
                      onPointerDown={() => warmNamed(track.title, track.artist, 'mv')}
                      onClick={() => playNamed(track.title, track.artist, 'mv')}
                    >
                      播放MV
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
