import { useState, type FormEvent, type ReactNode } from 'react'
import { Cover } from '../components/Cover'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { PageHero } from '../components/PageHero'
import { usePlayer } from '../components/PlayerProvider'
import { SongList } from '../components/SongList'
import { PAGE_COPY } from '../data/brand'
import {
  clearRecentPlays,
  createMyPlaylist,
  deleteMyPlaylist,
  getFavorites,
  getMyPlaylists,
  getRecentPlays,
  removeFromMyPlaylist,
  type MyPlaylist,
} from '../lib/library'
import { hashWith } from '../lib/route'
import { thumbUrl, type MusicItem } from '../lib/search'
import { usePageTitle } from '../lib/title'
import { toast } from '../lib/toast'
import { useLibraryVersion } from '../lib/useLibrary'

type Tab = 'fav' | 'lists' | 'recent'

const EMPTY = '这里还没有音乐，去收藏一些喜欢的歌吧'

function Toolbar({ songs, children }: { songs: MusicItem[]; children?: ReactNode }) {
  const player = usePlayer()
  return (
    <div className="toolbar">
      <button type="button" className="btn" disabled={!songs.length} onClick={() => songs[0] && player.play(songs[0], 'audio', songs)}>
        <Icon name="play" size={16} />
        播放全部
      </button>
      {children}
    </div>
  )
}

function Favorites() {
  const player = usePlayer()
  const songs = getFavorites()
  if (!songs.length) return <EmptyState title={EMPTY} hint="在任意一首歌上点小爱心，它就会被收进你的音乐宇宙。" href="#/toplist" action="去排行榜挑几首" />
  return (
    <>
      <Toolbar songs={songs}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (window.confirm('确定清空「我喜欢的音乐」吗？')) player.clearFavorites()
          }}
        >
          <Icon name="trash" size={16} />
          清空
        </button>
      </Toolbar>
      <SongList songs={songs} onRemove={(song) => player.removeFavorite(song.id)} removeLabel="移出我的音乐宇宙" />
    </>
  )
}

function CreateForm() {
  const [name, setName] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const list = createMyPlaylist(name.trim() || '我的专属歌单')
    setName('')
    toast(`「${list.name}」创建好了，去给它添几首歌吧`)
    window.location.hash = hashWith('/mine', { tab: 'lists', list: list.id })
  }
  return (
    <form className="create-card" onSubmit={submit}>
      <span className="create-icon">
        <Icon name="plus" size={26} />
      </span>
      <strong>创建我的专属歌单</strong>
      <input value={name} maxLength={40} placeholder="起个名字，比如「下雨天听的歌」" aria-label="歌单名称" onChange={(event) => setName(event.target.value)} />
      <button type="submit" className="btn btn-sm">
        创建
      </button>
    </form>
  )
}

function PlaylistView({ list }: { list: MyPlaylist }) {
  usePageTitle(list.name, '我的音乐')
  return (
    <>
      <div className="mine-list-head">
        <a className="text-btn" href={hashWith('/mine', { tab: 'lists' })}>
          <Icon name="chevronLeft" size={14} />
          全部歌单
        </a>
        <h3>{list.name}</h3>
        <span className="meta">
          {list.songs.length} 首 · {new Date(list.created).toLocaleDateString('zh-CN')} 创建
        </span>
      </div>
      <Toolbar songs={list.songs}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (!window.confirm(`确定删除歌单「${list.name}」吗？`)) return
            deleteMyPlaylist(list.id)
            toast('歌单已删除')
            window.location.hash = hashWith('/mine', { tab: 'lists' })
          }}
        >
          <Icon name="trash" size={16} />
          删除歌单
        </button>
      </Toolbar>
      {list.songs.length ? (
        <SongList songs={list.songs} onRemove={(song) => removeFromMyPlaylist(list.id, song.id)} removeLabel="从歌单移除" />
      ) : (
        <EmptyState title={EMPTY} hint="在任意一首歌上点「+」，就能把它加进这张歌单。" href="#/toplist" action="去排行榜挑几首" />
      )}
    </>
  )
}

function Playlists({ openId }: { openId: string }) {
  const lists = getMyPlaylists()
  const open = lists.find((item) => item.id === openId)
  if (open) return <PlaylistView list={open} />
  return (
    <div className="tile-grid is-five">
      <CreateForm />
      {lists.map((list) => (
        <article key={list.id} className="tile">
          <a className="tile-cover" href={hashWith('/mine', { tab: 'lists', list: list.id })} aria-label={list.name}>
            <Cover src={thumbUrl(list.songs[0]?.image, 300)} alt="" />
          </a>
          <a className="tile-name" href={hashWith('/mine', { tab: 'lists', list: list.id })}>
            {list.name}
          </a>
          <span className="tile-meta">{list.songs.length} 首</span>
        </article>
      ))}
    </div>
  )
}

function Recent() {
  const songs = getRecentPlays()
  if (!songs.length) return <EmptyState title="还没有播放记录" hint="听过的歌会留在这里，方便你回到上一份心动。" href="#/daily" action="听听今日推荐" />
  return (
    <>
      <Toolbar songs={songs}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (window.confirm('确定清空最近播放吗？')) clearRecentPlays()
          }}
        >
          <Icon name="trash" size={16} />
          清空记录
        </button>
      </Toolbar>
      <SongList songs={songs} />
    </>
  )
}

export function MinePage({ params }: { params: Record<string, string> }) {
  useLibraryVersion()
  const tab: Tab = params.tab === 'lists' || params.tab === 'recent' ? params.tab : params.list ? 'lists' : 'fav'
  const tabs: { id: Tab; name: string; count: number }[] = [
    { id: 'fav', name: '我喜欢的音乐', count: getFavorites().length },
    { id: 'lists', name: '我的歌单', count: getMyPlaylists().length },
    { id: 'recent', name: '最近播放', count: getRecentPlays().length },
  ]

  return (
    <>
      <PageHero copy={PAGE_COPY.mine} compact />
      <section className="panel">
        <div className="tabs" role="tablist" aria-label="我的音乐">
          {tabs.map((item) => (
            <a key={item.id} role="tab" aria-selected={item.id === tab} className={item.id === tab ? 'active' : undefined} href={hashWith('/mine', { tab: item.id === 'fav' ? '' : item.id })}>
              {item.name}
              <small>{item.count}</small>
            </a>
          ))}
        </div>
        {tab === 'fav' ? <Favorites /> : null}
        {tab === 'lists' ? <Playlists openId={params.list ?? ''} /> : null}
        {tab === 'recent' ? <Recent /> : null}
        <p className="meta mine-note">收藏、歌单和播放记录都保存在当前浏览器里，换设备或清除网站数据后不会跟着走。</p>
      </section>
    </>
  )
}
