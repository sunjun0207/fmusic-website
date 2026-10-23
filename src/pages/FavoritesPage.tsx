import { useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { usePlayer } from '../components/PlayerProvider'
import { getFavorites } from '../lib/library'
import { coverUrl, formatDuration, type MusicItem } from '../lib/search'

export function FavoritesPage() {
  const player = usePlayer()
  const [list, setList] = useState<MusicItem[]>(() => getFavorites())

  useEffect(() => {
    setList(getFavorites())
  }, [player.libraryVersion])

  return (
    <>
      <header className="search-hero">
        <h1>收藏</h1>
        <p>播放时点收藏，歌会留在这里。换一台浏览器或清除站点数据后，这份列表不会跟着走。</p>
        {list.length ? (
          <button
            type="button"
            className="btn btn-line"
            onClick={() => {
              if (window.confirm('清空全部收藏？')) player.clearFavorites()
            }}
          >
            清空收藏
          </button>
        ) : null}
      </header>
      {list.length === 0 ? (
        <EmptyState title="还没有收藏。" hint="播放条上的收藏会把当前这首加进来。" />
      ) : (
        <div className="table-wrap">
          <table className="song-table">
            <thead>
              <tr>
                <th className="col-cover" />
                <th>歌曲</th>
                <th>歌手</th>
                <th className="hide-sm">专辑</th>
                <th className="hide-sm">时长</th>
                <th className="col-action">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((song) => {
                const cover = coverUrl(song.image)
                const playing = player.playingId === song.id
                return (
                  <tr key={song.id} className={playing ? 'is-playing is-clickable' : 'is-clickable'} onClick={() => player.play(song, 'audio', list)}>
                    <td>
                      {cover ? <img className="song-cover" src={cover} alt="" /> : <span className="song-cover song-cover-empty" />}
                    </td>
                    <td>{song.title}</td>
                    <td>{song.artist}</td>
                    <td className="hide-sm">{song.album || <span className="muted">—</span>}</td>
                    <td className="hide-sm">{formatDuration(song.duration) || <span className="muted">—</span>}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="text-btn"
                          onClick={(event) => {
                            event.stopPropagation()
                            player.play(song, 'audio', list)
                          }}
                        >
                          播放歌曲
                        </button>
                        <button
                          type="button"
                          className="text-btn fav-on"
                          onClick={(event) => {
                            event.stopPropagation()
                            player.removeFavorite(song.id)
                          }}
                        >
                          取消收藏
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
