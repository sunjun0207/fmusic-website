import { useState } from 'react'
import { ChartColumn } from '../components/ChartColumn'
import { Cover } from '../components/Cover'
import { ErrorState, LoadingState } from '../components/EmptyState'
import { Remote } from '../components/Remote'
import { HomeAside } from '../components/home/HomeAside'
import { HomeHero } from '../components/home/HomeHero'
import { Icon } from '../components/Icon'
import { WaveArt } from '../components/PageHero'
import { usePlayer } from '../components/PlayerProvider'
import { PostCard } from '../components/PostCard'
import { SectionHead } from '../components/SectionHead'
import { artistHref, useFavoriteToggle } from '../components/SongList'
import { StationCard, toneStyle, useTuner } from '../components/StationCard'
import { PlaylistGrid, PlaylistTile } from '../components/Tiles'
import { usePlayAll } from '../components/usePlayAll'
import { BRAND_STORY, HOME_COPY, STATIONS, THEMES, stationForHour, type Theme } from '../data/brand'
import { fetchCommentWall } from '../lib/community'
import { getDailyMix } from '../lib/daily'
import { freshDate, weekday } from '../lib/format'
import { fetchChartGroups, fetchChartSongs, fetchPlaylists, fetchRecommendPlaylists, type ChartInfo } from '../lib/kuwo'
import { privateSongs, tagSongs } from '../lib/radio'
import { coverUrl, formatDuration, thumbUrl, withCoverSize, type MusicItem } from '../lib/search'
import { useInView } from '../lib/useInView'
import { useRemote } from '../lib/useRemote'

/* ---------- 为你推荐 ---------- */

function ForYou() {
  const rcm = useRemote('pl:rcm:10', () => fetchRecommendPlaylists(10))
  const { busy, start } = usePlayAll()
  const tuner = useTuner()
  const today = new Date()

  return (
    <section className="home-section">
      <SectionHead {...HOME_COPY.forYou} more="#/playlists" />
      <div className="tile-grid">
        <article className="tile is-special">
          <div className="tile-cover special-cover is-daily">
            <a href="#/daily" aria-label="每日推荐" tabIndex={-1}>
              <span className="special-art">
                <small>{weekday(today)}</small>
                <strong>{today.getDate()}</strong>
                <em>DAILY MIX</em>
              </span>
            </a>
            <button type="button" className="cover-play" aria-label="播放每日推荐" disabled={busy !== ''} onClick={() => void start('daily', () => getDailyMix().then((mix) => mix.songs))}>
              {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="play" size={18} />}
            </button>
          </div>
          <a className="tile-name" href="#/daily">
            每日推荐 · 今日 30 首
          </a>
          <span className="tile-meta">根据你的口味每日更新</span>
        </article>
        <article className="tile is-special">
          <div className="tile-cover special-cover is-private">
            <a href="#/radio" aria-label="私人专属电台" tabIndex={-1}>
              <span className="special-art">
                <Icon name="radio" size={34} />
                <em>JUST FOR YOU</em>
              </span>
            </a>
            <button type="button" className="cover-play" aria-label="收听私人专属电台" disabled={tuner.busy !== ''} onClick={() => void tuner.tune('private', '私人专属电台', privateSongs)}>
              {tuner.busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="play" size={18} />}
            </button>
          </div>
          <a className="tile-name" href="#/radio">
            {HOME_COPY.private.title}电台{tuner.onAir === 'private' ? ' · 收听中' : ''}
          </a>
          <span className="tile-meta">{HOME_COPY.private.desc}</span>
        </article>
        {(rcm.data ?? []).slice(0, 8).map((item) => (
          <PlaylistTile key={item.id} item={item} note={item.intro || undefined} />
        ))}
      </div>
      {!rcm.data && rcm.error ? <ErrorState text={rcm.error} onRetry={rcm.reload} /> : null}
      {!rcm.data && !rcm.error ? <LoadingState compact /> : null}
    </section>
  )
}

/* ---------- 精选推荐 ---------- */

function themeSongs(theme: Theme) {
  return theme.source.kind === 'chart' ? fetchChartSongs(theme.source.id, 1, 50).then((page) => page.songs) : tagSongs(theme.source.id)
}

function Picks() {
  const { busy, start } = usePlayAll()
  return (
    <section className="home-section">
      <SectionHead {...HOME_COPY.picks} />
      <div className="theme-grid">
        {THEMES.map((theme) => (
          <article key={theme.id} className="theme-card" style={toneStyle(theme.tone)}>
            <a className="theme-link" href={theme.href}>
              <span className="theme-en">{theme.en}</span>
              <strong>{theme.title}</strong>
              <span className="theme-desc">{theme.desc}</span>
            </a>
            <button type="button" className="theme-play" aria-label={`播放「${theme.title}」`} disabled={busy !== ''} onClick={() => void start(theme.id, () => themeSongs(theme))}>
              {busy === theme.id ? <span className="spinner" aria-hidden="true" /> : <Icon name="play" size={16} />}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ---------- 全网热歌 ---------- */

function HotSongs() {
  const remote = useRemote('chart:16:1:30', () => fetchChartSongs('16', 1, 30))
  const player = usePlayer()
  return (
    <section className="home-section">
      <SectionHead {...HOME_COPY.hot} more="#/toplist/16" moreLabel="完整热歌榜" />
      <Remote remote={remote}>
        {(page) => (
          <div className="hot-grid">
            {page.songs.slice(0, 5).map((song, index) => (
              <article key={song.id} className={player.playingId === song.id ? 'hot-card is-playing' : 'hot-card'}>
                <button type="button" className="hot-cover" aria-label={`播放这首歌：${song.title}`} onPointerDown={() => player.warm(song)} onClick={() => player.play(song, 'audio', page.songs)}>
                  <Cover src={withCoverSize(coverUrl(song.image), 300)} alt="" />
                  <span className="hot-rank">{String(index + 1).padStart(2, '0')}</span>
                  <span className="hot-play">
                    <Icon name="play" size={20} />
                  </span>
                </button>
                <a className="tile-name" href={`#/song/${song.id}`} title={song.title}>
                  {song.title}
                </a>
                <a className="tile-meta" href={artistHref(song)}>
                  {song.artist}
                </a>
              </article>
            ))}
          </div>
        )}
      </Remote>
    </section>
  )
}

/* ---------- 每日新歌 ---------- */

function MiniSong({ song, queue }: { song: MusicItem; queue: MusicItem[] }) {
  const player = usePlayer()
  const favorite = useFavoriteToggle()
  const loved = favorite.loved(song.id)
  return (
    <li className={player.playingId === song.id ? 'mini-song is-playing' : 'mini-song'}>
      <button type="button" className="mini-cover" aria-label={`播放这首歌：${song.title}`} onPointerDown={() => player.warm(song)} onClick={() => player.play(song, 'audio', queue)}>
        <Cover src={thumbUrl(song.image)} alt="" />
        <Icon name="play" size={16} />
      </button>
      <div className="mini-main">
        <a href={`#/song/${song.id}`} title={song.title}>
          {song.title}
        </a>
        <span>
          <a href={artistHref(song)}>{song.artist}</a>
          {song.releaseDate ? ` · ${freshDate(song.releaseDate)}` : formatDuration(song.duration) ? ` · ${formatDuration(song.duration)}` : ''}
        </span>
      </div>
      <button type="button" className={loved ? 'op-btn is-loved' : 'op-btn'} aria-pressed={loved} aria-label="收进我的音乐宇宙" title="收进我的音乐宇宙" onClick={() => favorite.toggle(song)}>
        <Icon name={loved ? 'heartFill' : 'heart'} size={16} />
      </button>
    </li>
  )
}

function FreshSongs() {
  const remote = useRemote('chart:17:1:30', () => fetchChartSongs('17', 1, 30))
  const { busy, start } = usePlayAll()
  return (
    <section className="home-section">
      <SectionHead {...HOME_COPY.fresh} more="#/albums" moreLabel="新碟上架">
        <button type="button" className="btn btn-sm btn-ghost" disabled={busy !== '' || !remote.data} onClick={() => void start('fresh', () => remote.data?.songs ?? [])}>
          <Icon name="play" size={14} />
          播放全部
        </button>
      </SectionHead>
      <Remote remote={remote}>
        {(page) => (
          <ul className="mini-grid">
            {page.songs.slice(0, 9).map((song) => (
              <MiniSong key={song.id} song={song} queue={page.songs} />
            ))}
          </ul>
        )}
      </Remote>
    </section>
  )
}

/* ---------- 宝藏歌单 ---------- */

const TREASURE_TABS = [
  { id: '', name: '热门' },
  { id: '37', name: '华语' },
  { id: '393', name: '流行' },
  { id: '392', name: '民谣' },
  { id: '391', name: '电子' },
  { id: '389', name: '摇滚' },
  { id: '127', name: '古风' },
]

function Treasure() {
  const [tag, setTag] = useState('')
  const remote = useRemote(`pl:list:${tag}:hot:1:10`, () => fetchPlaylists({ tag, page: 1, size: 10 }))
  return (
    <section className="home-section">
      <SectionHead {...HOME_COPY.playlists} more={tag ? `#/playlists?tag=${tag}` : '#/playlists'}>
        <div className="tabs is-small" role="tablist" aria-label="歌单分类">
          {TREASURE_TABS.map((item) => (
            <button key={item.id || 'hot'} type="button" role="tab" aria-selected={item.id === tag} className={item.id === tag ? 'active' : undefined} onClick={() => setTag(item.id)}>
              {item.name}
            </button>
          ))}
        </div>
      </SectionHead>
      <Remote remote={remote}>{(page) => <PlaylistGrid items={page.list.slice(0, 10)} />}</Remote>
    </section>
  )
}

/* ---------- 热门排行榜 ---------- */

const HOME_CHARTS: ChartInfo[] = [
  { id: '93', name: '飙升榜', intro: '', pic: '', pub: '' },
  { id: '158', name: '抖音热歌榜', intro: '', pic: '', pub: '' },
  { id: '153', name: '网红新歌榜', intro: '', pic: '', pub: '' },
]

function Charts() {
  const menu = useRemote('chart:menu', fetchChartGroups)
  const all = (menu.data ?? []).flatMap((group) => group.charts)
  const charts = HOME_CHARTS.map((chart) => all.find((item) => item.id === chart.id) ?? chart)
  return (
    <section className="home-section">
      <SectionHead {...HOME_COPY.charts} more="#/toplist" moreLabel="全部榜单" />
      <div className="chart-cols">
        {charts.map((chart) => (
          <ChartColumn key={chart.id} chart={chart} />
        ))}
      </div>
    </section>
  )
}

/* ---------- 音乐电台 ---------- */

function RadioRow() {
  const tuner = useTuner()
  const now = stationForHour()
  const list = [now, ...STATIONS.filter((station) => station.id !== now.id)].slice(0, 5)
  return (
    <section className="home-section">
      <SectionHead {...HOME_COPY.radio} more="#/radio" moreLabel="全部电台" />
      <div className="station-row">
        {list.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            live={station.id === now.id}
            onAir={tuner.onAir === station.id}
            busy={tuner.busy === station.id}
            onTune={() => void tuner.tuneStation(station)}
          />
        ))}
      </div>
    </section>
  )
}

/* ---------- 音乐社区 ---------- */

function CommunityRow() {
  const { ref, seen } = useInView<HTMLElement>()
  const remote = useRemote('wall:1:12', () => fetchCommentWall(1, 12), seen)
  return (
    <section className="home-section" ref={ref}>
      <SectionHead {...HOME_COPY.community} more="#/community" moreLabel="进入社区" />
      <Remote remote={remote}>
        {(posts) => (
          <div className="post-grid is-row">
            {posts.slice(0, 4).map((post) => (
              <PostCard key={`${post.song.id}-${post.comment.id}`} post={post} queue={posts} />
            ))}
          </div>
        )}
      </Remote>
    </section>
  )
}

/* ---------- 品牌介绍 ---------- */

function BrandBand() {
  return (
    <section className="brand-band">
      <WaveArt className="brand-band-wave" />
      <div className="wrap brand-band-inner">
        <p className="eyebrow">ABOUT JUN.SUN</p>
        <h2>{BRAND_STORY.title}</h2>
        {BRAND_STORY.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p className="brand-band-sign">{BRAND_STORY.sign}</p>
        <div className="hero-actions">
          <a className="btn" href="#/community">
            去社区遇见同频的人
          </a>
          <a className="btn btn-ghost" href="#/about">
            了解聆听
          </a>
        </div>
      </div>
    </section>
  )
}

export function HomePage() {
  return (
    <div className="home">
      <HomeHero />
      <div className="wrap home-body">
        <div className="home-main">
          <ForYou />
          <Picks />
          <Treasure />
          <FreshSongs />
          <HotSongs />
        </div>
        <HomeAside />
      </div>
      <div className="wrap home-wide">
        <Charts />
        <RadioRow />
        <CommunityRow />
      </div>
      <BrandBand />
    </div>
  )
}
