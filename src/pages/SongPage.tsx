import { useState } from 'react'
import { CommentList } from '../components/CommentList'
import { CommentPanel } from '../components/CommentPanel'
import { Cover } from '../components/Cover'
import { LoadingState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { openPlaylistPicker } from '../components/PlaylistPicker'
import { usePlayer } from '../components/PlayerProvider'
import { Remote } from '../components/Remote'
import { artistHref, SongList, useFavoriteToggle } from '../components/SongList'
import { fetchHotComments } from '../lib/comment'
import { fetchArtistSongs, fetchSong } from '../lib/kuwo'
import { getLyric } from '../lib/lyric'
import { coverUrl, formatDuration, isSongWithoutMv, searchMusic, withCoverSize, type MusicItem } from '../lib/search'
import { shareSong } from '../lib/share'
import { usePageTitle } from '../lib/title'
import { useRemote } from '../lib/useRemote'

function Lyrics({ id }: { id: string }) {
  const remote = useRemote(`lyric:${id}`, () => getLyric(id))
  const [open, setOpen] = useState(false)
  const lines = remote.data ?? []
  return (
    <section className="panel">
      <div className="list-head">
        <h2>
          歌词<small>LYRICS</small>
        </h2>
      </div>
      {remote.data ? (
        lines.length ? (
          <>
            <div className={open ? 'lyric-sheet is-open' : 'lyric-sheet'}>
              {(open ? lines : lines.slice(0, 16)).map((line, index) => (
                <p key={`${line.time}-${index}`}>{line.lineLyric}</p>
              ))}
            </div>
            {lines.length > 16 ? (
              <button type="button" className="text-btn" onClick={() => setOpen((value) => !value)}>
                {open ? '收起' : `展开全部 ${lines.length} 行`}
              </button>
            ) : null}
          </>
        ) : (
          <p className="meta">这首歌暂时没有歌词，闭上眼睛听就好。</p>
        )
      ) : remote.error ? (
        <p className="meta">歌词暂时没取到，播放时会再试一次。</p>
      ) : (
        <LoadingState compact />
      )}
    </section>
  )
}

function HotComments({ id }: { id: string }) {
  const remote = useRemote(`hot-comments:${id}`, () => fetchHotComments(id, 10))
  if (remote.data && !remote.data.length) return null
  return (
    <section className="panel">
      <div className="list-head">
        <h2>
          精彩评论<small>HOT COMMENTS</small>
        </h2>
      </div>
      {remote.data ? <CommentList items={remote.data} /> : remote.error ? <p className="meta">{remote.error}</p> : <LoadingState compact />}
    </section>
  )
}

function MoreFromArtist({ song }: { song: MusicItem }) {
  const remote = useRemote(`more:${song.artistId || song.artist}`, () =>
    song.artistId ? fetchArtistSongs(song.artistId, 1, 12).then((data) => data.songs) : searchMusic(song.artist, 0, 12).then((data) => data.list),
  )
  const list = (remote.data ?? []).filter((item) => item.id !== song.id).slice(0, 10)
  return (
    <section className="aside-card">
      <div className="aside-head">
        <h2>{song.artist} 的更多好歌</h2>
        <a href={artistHref(song)}>全部</a>
      </div>
      {remote.data ? list.length ? <SongList songs={list} showAlbum={false} /> : <p className="aside-note">暂时没有更多了。</p> : <LoadingState compact />}
    </section>
  )
}

export function SongPage({ id }: { id: string }) {
  const remote = useRemote(`song:${id}`, () => fetchSong(id))
  const player = usePlayer()
  const favorite = useFavoriteToggle()

  usePageTitle(remote.data ? `${remote.data.title} - ${remote.data.artist}` : '')

  if (!remote.data) return <Remote remote={remote}>{() => null}</Remote>
  const song = remote.data
  const playing = player.playingId === song.id
  const loved = favorite.loved(song.id)
  const hasMv = song.hasMv && !isSongWithoutMv(song.id)

  return (
    <div className="detail-layout">
      <div className="detail-main">
        <header className="detail-head panel is-song">
          <div className={playing ? 'vinyl is-spinning' : 'vinyl'}>
            <Cover className="vinyl-cover" src={withCoverSize(coverUrl(song.image), 500)} eager />
          </div>
          <div className="detail-info">
            <p className="eyebrow">SONG · 单曲</p>
            <h1>
              {song.title}
              {hasMv ? <span className="tag-mv">MV</span> : null}
            </h1>
            <dl className="song-facts">
              <div>
                <dt>歌手</dt>
                <dd>
                  <a href={artistHref(song)}>{song.artist}</a>
                </dd>
              </div>
              {song.album ? (
                <div>
                  <dt>专辑</dt>
                  <dd>{song.albumId ? <a href={`#/album/${song.albumId}`}>{song.album}</a> : song.album}</dd>
                </div>
              ) : null}
              {song.releaseDate ? (
                <div>
                  <dt>发行</dt>
                  <dd>{song.releaseDate}</dd>
                </div>
              ) : null}
              {formatDuration(song.duration) ? (
                <div>
                  <dt>时长</dt>
                  <dd>{formatDuration(song.duration)}</dd>
                </div>
              ) : null}
            </dl>
            <div className="hero-actions">
              <button type="button" className="btn" onPointerDown={() => player.warm(song)} onClick={() => player.play(song, 'audio')}>
                <Icon name={playing ? 'wave' : 'play'} size={16} />
                {playing ? '正在播放' : '播放这首歌'}
              </button>
              {hasMv ? (
                <button type="button" className="btn btn-ghost" onClick={() => player.play(song, 'mv')}>
                  <Icon name="mv" size={16} />
                  看 MV
                </button>
              ) : null}
              <button type="button" className={loved ? 'btn btn-ghost is-loved' : 'btn btn-ghost'} aria-pressed={loved} onClick={() => favorite.toggle(song)}>
                <Icon name={loved ? 'heartFill' : 'heart'} size={16} />
                {loved ? '已收进我的音乐宇宙' : '收进我的音乐宇宙'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => openPlaylistPicker(song)}>
                <Icon name="plus" size={16} />
                加入歌单
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => void shareSong(song)}>
                <Icon name="share" size={16} />
                把这份喜欢分享出去
              </button>
            </div>
          </div>
        </header>
        <Lyrics id={song.id} />
        <HotComments id={song.id} />
        <section className="panel song-comments">
          <CommentPanel songId={song.id} />
        </section>
      </div>
      <aside className="detail-aside">
        <MoreFromArtist song={song} />
      </aside>
    </div>
  )
}
