import { Cover } from '../components/Cover'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { Remote } from '../components/Remote'
import { SongList } from '../components/SongList'
import { usePlayAll } from '../components/usePlayAll'
import { formatCount } from '../lib/format'
import { fetchAlbum } from '../lib/kuwo'
import { createMyPlaylist } from '../lib/library'
import { coverUrl, withCoverSize } from '../lib/search'
import { shareCurrentPage } from '../lib/share'
import { usePageTitle } from '../lib/title'
import { toast } from '../lib/toast'
import { useRemote } from '../lib/useRemote'

export function AlbumDetailPage({ id }: { id: string }) {
  const remote = useRemote(`album:${id}:1:100`, () => fetchAlbum(id))
  const { busy, start } = usePlayAll()

  usePageTitle(remote.data?.name, '专辑')

  if (!remote.data) return <Remote remote={remote}>{() => null}</Remote>
  const album = remote.data

  return (
    <div className="detail-layout">
      <div className="detail-main">
        <header className="detail-head panel">
          <Cover className="detail-cover is-album" src={withCoverSize(coverUrl(album.pic), 500)} eager />
          <div className="detail-info">
            <p className="eyebrow">ALBUM · 专辑</p>
            <h1>{album.name}</h1>
            <p className="meta">
              {album.artistId ? <a href={`#/artist/${album.artistId}`}>{album.artist}</a> : album.artist}
              {album.date ? ` · ${album.date} 发行` : ''}
              {album.lang ? ` · ${album.lang}` : ''}
            </p>
            <p className="meta">
              {album.total || album.songs.length} 首{album.plays ? ` · ${formatCount(album.plays)} 次播放` : ''}
            </p>
            <div className="hero-actions">
              <button type="button" className="btn" disabled={busy !== '' || !album.songs.length} onClick={() => void start(album.id, () => album.songs)}>
                <Icon name="play" size={16} />
                播放全部
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!album.songs.length}
                onClick={() => {
                  const list = createMyPlaylist(album.name, album.songs)
                  toast(`已把「${list.name}」收进我的音乐，共 ${list.songs.length} 首`)
                }}
              >
                <Icon name="plus" size={16} />
                收进我的歌单
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => void shareCurrentPage(album.name)}>
                <Icon name="share" size={16} />
                分享
              </button>
            </div>
          </div>
        </header>
        <section className="panel">
          <div className="list-head">
            <h2>
              曲目<small>{album.songs.length} 首</small>
            </h2>
          </div>
          {album.songs.length ? <SongList songs={album.songs} showAlbum={false} /> : <EmptyState title="这张专辑暂时没有可以播放的歌" />}
        </section>
      </div>
      <aside className="detail-aside">
        <section className="aside-card">
          <div className="aside-head">
            <h2>专辑介绍</h2>
          </div>
          {album.info.length ? (
            <div className="aside-text">
              {album.info.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          ) : (
            <p className="aside-note">这张专辑还没有介绍，让音乐自己说话吧。</p>
          )}
        </section>
      </aside>
    </div>
  )
}
