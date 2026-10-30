import { useState } from 'react'
import { CommentList } from '../components/CommentList'
import { Cover } from '../components/Cover'
import { EmptyState, ErrorState, LoadingState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { Avatar } from '../components/PostCard'
import { Remote } from '../components/Remote'
import { SongList } from '../components/SongList'
import { PlaylistTile } from '../components/Tiles'
import { usePlayAll } from '../components/usePlayAll'
import { fetchPlaylistComments } from '../lib/comment'
import { formatCount } from '../lib/format'
import { fetchPlaylistDetail, fetchRecommendPlaylists, type PlaylistDetail } from '../lib/kuwo'
import { createMyPlaylist } from '../lib/library'
import { coverUrl, withCoverSize } from '../lib/search'
import { shareCurrentPage } from '../lib/share'
import { usePageTitle } from '../lib/title'
import { toast } from '../lib/toast'
import { useInView } from '../lib/useInView'
import { useRemote } from '../lib/useRemote'

const STEP = 100

async function loadDetail(id: string, pages: number): Promise<PlaylistDetail> {
  const list = await Promise.all(Array.from({ length: pages }, (_, index) => fetchPlaylistDetail(id, index + 1, STEP)))
  const first = list[0] as PlaylistDetail
  const songs = new Map(list.flatMap((page) => page.songs).map((song) => [song.id, song]))
  return { ...first, songs: [...songs.values()] }
}

function Intro({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  if (!text) return null
  const long = text.length > 90
  return (
    <p className="detail-intro">
      {open || !long ? text : `${text.slice(0, 90)}…`}
      {long ? (
        <button type="button" className="text-btn" onClick={() => setOpen((value) => !value)}>
          {open ? '收起' : '展开'}
        </button>
      ) : null}
    </p>
  )
}

function ListenerComments({ id }: { id: string }) {
  const { ref, seen } = useInView<HTMLElement>()
  const remote = useRemote(`pl:comments:${id}`, () => fetchPlaylistComments(id, 1, 10), seen)
  return (
    <section className="aside-card" ref={ref}>
      <div className="aside-head">
        <h2>
          听友评论
          {remote.data?.total ? <small>{formatCount(remote.data.total)}</small> : null}
        </h2>
      </div>
      {remote.data ? (
        remote.data.list.length ? (
          <CommentList items={remote.data.list} />
        ) : (
          <p className="aside-note">这张歌单还没有评论，先听听看吧。</p>
        )
      ) : remote.error ? (
        <p className="aside-note">{remote.error}</p>
      ) : (
        <LoadingState compact />
      )}
    </section>
  )
}

function Related({ id }: { id: string }) {
  const remote = useRemote('pl:rcm:10', () => fetchRecommendPlaylists(10))
  const list = (remote.data ?? []).filter((item) => item.id !== id).slice(0, 4)
  if (!list.length) return null
  return (
    <section className="aside-card">
      <div className="aside-head">
        <h2>喜欢这张歌单的人也在听</h2>
      </div>
      <div className="tile-grid is-two">
        {list.map((item) => (
          <PlaylistTile key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

export function PlaylistDetailPage({ id }: { id: string }) {
  const [pages, setPages] = useState(1)
  const remote = useRemote(`pl:detail:${id}:${pages}`, () => loadDetail(id, pages))
  const [shown, setShown] = useState<PlaylistDetail | null>(null)
  const data = remote.data ?? (shown?.id === id ? shown : undefined)
  if (remote.data && remote.data !== shown) setShown(remote.data)
  const { busy, start } = usePlayAll()

  usePageTitle(data?.name, '歌单')

  if (!data) {
    return <Remote remote={remote}>{() => null}</Remote>
  }

  const hasMore = data.songs.length < data.count && data.songs.length >= pages * STEP - 5 && pages < 10

  const collect = () => {
    const list = createMyPlaylist(data.name, data.songs)
    toast(`已把「${list.name}」收进我的音乐，共 ${list.songs.length} 首`)
  }

  return (
    <div className="detail-layout">
      <div className="detail-main">
        <header className="detail-head panel">
          <Cover className="detail-cover" src={withCoverSize(coverUrl(data.cover), 500)} eager />
          <div className="detail-info">
            <p className="eyebrow">PLAYLIST · 歌单</p>
            <h1>{data.name}</h1>
            {data.creator ? (
              <p className="detail-creator">
                <Avatar src={data.creatorPic} name={data.creator} />
                <span>{data.creator}</span>
                <small>创建</small>
              </p>
            ) : null}
            <p className="meta">
              {formatCount(data.plays)} 次播放 · {data.count || data.songs.length} 首
            </p>
            {data.tags.length ? (
              <div className="chip-row">
                {data.tags.map((tag) => (
                  <span key={tag} className="chip is-static">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <Intro text={data.intro} />
            <div className="hero-actions">
              <button type="button" className="btn" disabled={busy !== '' || !data.songs.length} onClick={() => void start(data.id, () => data.songs)}>
                <Icon name="play" size={16} />
                播放全部
              </button>
              <button type="button" className="btn btn-ghost" disabled={!data.songs.length} onClick={collect}>
                <Icon name="plus" size={16} />
                收进我的歌单
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => void shareCurrentPage(data.name)}>
                <Icon name="share" size={16} />
                分享
              </button>
            </div>
          </div>
        </header>
        <section className="panel">
          <div className="list-head">
            <h2>
              歌曲列表<small>{data.count || data.songs.length} 首</small>
            </h2>
          </div>
          {data.songs.length ? <SongList songs={data.songs} /> : <EmptyState title="这里还没有音乐，去收藏一些喜欢的歌吧" />}
          {hasMore ? (
            <button type="button" className="btn btn-ghost load-more" disabled={remote.loading} onClick={() => setPages((value) => value + 1)}>
              {remote.loading ? '正在为你寻找好声音……' : '加载更多'}
            </button>
          ) : null}
          {remote.error && !remote.data ? <ErrorState text={remote.error} onRetry={remote.reload} /> : null}
        </section>
      </div>
      <aside className="detail-aside">
        <ListenerComments id={id} />
        <Related id={id} />
      </aside>
    </div>
  )
}
