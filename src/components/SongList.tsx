import { useSyncExternalStore } from 'react'
import type { Trend } from '../lib/kuwo'
import { searchHash } from '../lib/route'
import { formatDuration, isSongWithoutMv, subscribeNoMv, thumbUrl, type MusicItem } from '../lib/search'
import { shareSong } from '../lib/share'
import { toast } from '../lib/toast'
import { useFavoriteIds } from '../lib/useLibrary'
import { Cover } from './Cover'
import { Icon } from './Icon'
import { openPlaylistPicker } from './PlaylistPicker'
import { usePlayer } from './PlayerProvider'

let noMvVersion = 0
subscribeNoMv(() => {
  noMvVersion += 1
})

export function artistHref(song: Pick<MusicItem, 'artist' | 'artistId'>) {
  return song.artistId ? `#/artist/${song.artistId}` : searchHash(song.artist)
}

function TrendMark({ trend }: { trend?: Trend }) {
  if (!trend) return null
  if (trend.dir === 'new') return <span className="trend is-new">NEW</span>
  if (trend.dir === 'same') return <span className="trend is-same">—</span>
  return (
    <span className={`trend is-${trend.dir}`}>
      <Icon name={trend.dir === 'up' ? 'arrowUp' : 'arrowDown'} size={11} />
      {trend.change}
    </span>
  )
}

/** 收藏按钮：所有列表、播放条共用一套文案。 */
export function useFavoriteToggle() {
  const player = usePlayer()
  const favorites = useFavoriteIds()
  return {
    loved: (id: string) => favorites.has(id),
    toggle: (song: MusicItem) => {
      const loved = favorites.has(song.id)
      player.toggleFavorite(song)
      toast(loved ? '已从我的音乐宇宙移出' : '已收进我的音乐宇宙')
    },
  }
}

type Props = {
  songs: MusicItem[]
  /** 点歌后放进播放列表的歌，默认就是当前列表。 */
  queue?: MusicItem[]
  start?: number
  ranked?: boolean
  trends?: Record<string, Trend>
  showAlbum?: boolean
  rowIdPrefix?: string
  onPlay?: (song: MusicItem, kind: 'audio' | 'mv') => void
  onRemove?: (song: MusicItem) => void
  removeLabel?: string
}

export function SongList({ songs, queue, start = 0, ranked = false, trends, showAlbum = true, rowIdPrefix, onPlay, onRemove, removeLabel = '移除' }: Props) {
  const player = usePlayer()
  const favorite = useFavoriteToggle()
  useSyncExternalStore(subscribeNoMv, () => noMvVersion)

  const play = (song: MusicItem, kind: 'audio' | 'mv' = 'audio') => {
    if (onPlay) onPlay(song, kind)
    else if (kind === 'mv') player.play(song, 'mv')
    else player.play(song, 'audio', queue ?? songs)
  }

  return (
    <ol className={`song-list${showAlbum ? '' : ' no-album'}${onRemove ? ' has-remove' : ''}`}>
      {songs.map((song, index) => {
        const order = start + index + 1
        const playing = player.playingId === song.id
        const loved = favorite.loved(song.id)
        const hasMv = song.hasMv && !isSongWithoutMv(song.id)
        return (
          <li
            key={song.id}
            id={rowIdPrefix ? `${rowIdPrefix}${song.id}` : undefined}
            className={playing ? 'song-row is-playing' : 'song-row'}
            tabIndex={0}
            aria-label={`播放这首歌：${song.title} - ${song.artist}`}
            onPointerDown={(event) => {
              if (!(event.target as HTMLElement).closest('a, button')) player.warm(song)
            }}
            onClick={(event) => {
              if (!(event.target as HTMLElement).closest('a, button')) play(song)
            }}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return
              event.preventDefault()
              play(song)
            }}
          >
            <span className={`song-index${ranked && order <= 3 ? ' is-top' : ''}`}>
              {playing ? (
                <span className="eq is-mini" aria-label="正在播放">
                  <i />
                  <i />
                  <i />
                </span>
              ) : (
                String(order).padStart(2, '0')
              )}
            </span>
            <Cover className="song-thumb" src={thumbUrl(song.image)} />
            <div className="song-main">
              <div className="song-name-line">
                <a className="song-name" href={`#/song/${song.id}`} title={song.title}>
                  {song.title}
                </a>
                {hasMv ? <span className="tag-mv">MV</span> : null}
                {trends ? <TrendMark trend={trends[song.id]} /> : null}
              </div>
              <a className="song-sub" href={artistHref(song)}>
                {song.artist}
              </a>
            </div>
            {showAlbum ? (
              song.album && song.albumId ? (
                <a className="song-album" href={`#/album/${song.albumId}`} title={song.album}>
                  {song.album}
                </a>
              ) : (
                <span className="song-album">{song.album || '—'}</span>
              )
            ) : null}
            <span className="song-time">{formatDuration(song.duration) || '--:--'}</span>
            <div className="song-ops">
              <button type="button" className="op-btn" aria-label="播放这首歌" title="播放这首歌" onClick={() => play(song)}>
                <Icon name="play" size={16} />
              </button>
              {hasMv ? (
                <button type="button" className="op-btn" aria-label="看 MV" title="看 MV" onClick={() => play(song, 'mv')}>
                  <Icon name="mv" size={16} />
                </button>
              ) : null}
              <button
                type="button"
                className={loved ? 'op-btn is-loved' : 'op-btn'}
                aria-pressed={loved}
                aria-label="收进我的音乐宇宙"
                title={loved ? '已收进我的音乐宇宙，再点一下移出' : '收进我的音乐宇宙'}
                onClick={() => favorite.toggle(song)}
              >
                <Icon name={loved ? 'heartFill' : 'heart'} size={16} />
              </button>
              <button type="button" className="op-btn" aria-label="加入歌单" title="加入歌单" onClick={() => openPlaylistPicker(song)}>
                <Icon name="plus" size={16} />
              </button>
              <button type="button" className="op-btn" aria-label="把这份喜欢分享出去" title="把这份喜欢分享出去" onClick={() => void shareSong(song)}>
                <Icon name="share" size={16} />
              </button>
              {onRemove ? (
                <button type="button" className="op-btn" aria-label={removeLabel} title={removeLabel} onClick={() => onRemove(song)}>
                  <Icon name="trash" size={16} />
                </button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
