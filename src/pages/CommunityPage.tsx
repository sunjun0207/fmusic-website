import { useRef, useState } from 'react'
import { ErrorState, LoadingState } from '../components/EmptyState'
import { HotSearch } from '../components/home/HomeAside'
import { Icon } from '../components/Icon'
import { PageHero } from '../components/PageHero'
import { usePlayer } from '../components/PlayerProvider'
import { PostCard } from '../components/PostCard'
import { Remote } from '../components/Remote'
import { SectionHead } from '../components/SectionHead'
import { artistHref } from '../components/SongList'
import { PlaylistGrid } from '../components/Tiles'
import { PAGE_COPY } from '../data/brand'
import { fetchCommentWall, type WallPost } from '../lib/community'
import { fetchChartSongs, fetchPlaylists } from '../lib/kuwo'
import { pageLink, shareLink } from '../lib/share'
import { PRODUCT } from '../lib/site'
import { useRemote } from '../lib/useRemote'

const WALL_PAGES = 8

function HotCommentChart() {
  const remote = useRemote('chart:284:1:30', () => fetchChartSongs('284', 1, 30))
  const player = usePlayer()
  return (
    <section className="aside-card">
      <div className="aside-head">
        <h2>热评榜</h2>
        <a href="#/toplist/284">完整榜单</a>
      </div>
      {remote.data ? (
        <ol className="aside-songs">
          {remote.data.songs.slice(0, 10).map((song, index) => (
            <li key={song.id} className={player.playingId === song.id ? 'is-playing' : undefined}>
              <span className={index < 3 ? 'rank is-top' : 'rank'}>{index + 1}</span>
              <span className="aside-song-main">
                <a href={`#/song/${song.id}`}>{song.title}</a>
                <a className="muted" href={artistHref(song)}>
                  {song.artist}
                </a>
              </span>
              <button type="button" className="op-btn" aria-label={`播放这首歌：${song.title}`} onClick={() => player.play(song, 'audio', remote.data?.songs)}>
                <Icon name="play" size={14} />
              </button>
            </li>
          ))}
        </ol>
      ) : remote.error ? (
        <p className="aside-note">{remote.error}</p>
      ) : (
        <LoadingState compact />
      )}
    </section>
  )
}

function ShareCard() {
  return (
    <section className="aside-card share-card">
      <Icon name="chat" size={26} />
      <strong>分享你的音乐故事</strong>
      <p>在任意一首歌上点「把这份喜欢分享出去」，链接会带上歌名和歌手，发给懂你的人。</p>
      <button
        type="button"
        className="btn btn-block"
        onClick={() => void shareLink(PRODUCT, `我在${PRODUCT}遇见了好多同频的人，一起来听歌吧：`, pageLink('#/community'))}
      >
        邀请朋友一起听
      </button>
    </section>
  )
}

export function CommunityPage() {
  const [page, setPage] = useState(1)
  const wall = useRemote(`wall:${page}:12`, () => fetchCommentWall(page, 12))
  const kept = useRef<WallPost[] | null>(null)
  if (wall.data) kept.current = wall.data
  const posts = wall.data ?? kept.current
  const fresh = useRemote('pl:list::new:1:12', () => fetchPlaylists({ order: 'new', page: 1, size: 12 }))

  return (
    <>
      <PageHero copy={PAGE_COPY.community}>
        <a className="btn btn-lg" href="#/mine?tab=lists">
          <Icon name="plus" size={18} />
          创建我的专属歌单
        </a>
        <button type="button" className="btn btn-lg btn-ghost" onClick={() => void shareLink(PRODUCT, `我在${PRODUCT}遇见了好多同频的人，一起来听歌吧：`, pageLink('#/community'))}>
          <Icon name="share" size={18} />
          邀请朋友
        </button>
      </PageHero>
      <div className="community-layout">
        <section className="community-main">
          <SectionHead title="乐评墙" en="COMMENT WALL" desc="每一条都来自真实听众的高赞热评，点一下就能听到那首歌。">
            <button type="button" className="btn btn-sm btn-ghost" disabled={wall.loading} onClick={() => setPage((value) => (value % WALL_PAGES) + 1)}>
              <Icon name="refresh" size={14} />
              {wall.loading && posts ? '正在换…' : '换一批'}
            </button>
          </SectionHead>
          {posts ? (
            <div className={wall.loading ? 'post-grid is-masonry is-dim' : 'post-grid is-masonry'}>
              {posts.map((post) => (
                <PostCard key={`${post.song.id}-${post.comment.id}`} post={post} queue={posts} />
              ))}
            </div>
          ) : wall.error ? (
            <ErrorState text={wall.error} onRetry={wall.reload} />
          ) : (
            <LoadingState />
          )}
        </section>
        <aside className="community-aside">
          <ShareCard />
          <HotCommentChart />
          <HotSearch limit={8} />
        </aside>
      </div>
      <section className="page-section">
        <SectionHead title="听友新歌单" en="FRESH PLAYLISTS" desc="刚刚被创建的歌单，藏着别人此刻的心情。" more="#/playlists?order=new" />
        <Remote remote={fresh}>{(data) => <PlaylistGrid items={data.list.slice(0, 12)} className="is-six" />}</Remote>
      </section>
    </>
  )
}
