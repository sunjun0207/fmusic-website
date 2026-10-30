import { Cover } from '../components/Cover'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { Pager } from '../components/Pager'
import { Remote } from '../components/Remote'
import { SongList } from '../components/SongList'
import { AlbumTile } from '../components/Tiles'
import { usePlayAll } from '../components/usePlayAll'
import { formatCount } from '../lib/format'
import { fetchArtist, fetchArtistAlbums, fetchArtistSongs, type ArtistDetail } from '../lib/kuwo'
import { hashWith } from '../lib/route'
import { coverUrl } from '../lib/search'
import { shareCurrentPage } from '../lib/share'
import { usePageTitle } from '../lib/title'
import { useRemote } from '../lib/useRemote'

const TABS = [
  { id: 'songs', name: '热门歌曲' },
  { id: 'albums', name: '专辑' },
  { id: 'info', name: '歌手简介' },
] as const

type Tab = (typeof TABS)[number]['id']

const SONG_SIZE = 50
const ALBUM_SIZE = 20

function Songs({ id, page }: { id: string; page: number }) {
  const remote = useRemote(`artist:songs:${id}:${page}:${SONG_SIZE}`, () => fetchArtistSongs(id, page, SONG_SIZE))
  const totalPages = Math.min(20, Math.ceil((remote.data?.total ?? 0) / SONG_SIZE))
  return (
    <Remote remote={remote}>
      {(data) =>
        data.songs.length ? (
          <>
            <SongList songs={data.songs} start={(page - 1) * SONG_SIZE} />
            <Pager page={page} totalPages={totalPages} hrefFor={(n) => hashWith(`/artist/${id}`, { page: n })} label="歌曲分页" />
          </>
        ) : (
          <EmptyState title="这位歌手还没有可以播放的歌" />
        )
      }
    </Remote>
  )
}

function Albums({ id, page }: { id: string; page: number }) {
  const remote = useRemote(`artist:albums:${id}:${page}:${ALBUM_SIZE}`, () => fetchArtistAlbums(id, page, ALBUM_SIZE))
  const totalPages = Math.min(20, Math.ceil((remote.data?.total ?? 0) / ALBUM_SIZE))
  return (
    <Remote remote={remote}>
      {(data) =>
        data.list.length ? (
          <>
            <div className="tile-grid is-five">
              {data.list.map((item) => (
                <AlbumTile key={item.id} item={item} />
              ))}
            </div>
            <Pager page={page} totalPages={totalPages} hrefFor={(n) => hashWith(`/artist/${id}`, { tab: 'albums', page: n })} label="专辑分页" />
          </>
        ) : (
          <EmptyState title="还没有收录这位歌手的专辑" />
        )
      }
    </Remote>
  )
}

function Info({ artist }: { artist: ArtistDetail }) {
  const facts = [
    ['英文名 / 别名', artist.alias],
    ['国籍', artist.country],
    ['性别', artist.gender],
    ['生日', artist.birthday],
    ['出生地', artist.birthplace],
    ['语言', artist.language],
  ].filter(([, value]) => value)
  return (
    <div className="artist-info">
      {facts.length ? (
        <dl className="fact-list">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {artist.info.length ? artist.info.map((line, index) => <p key={index}>{line}</p>) : <EmptyState title="暂时还没有这位歌手的简介" />}
    </div>
  )
}

export function ArtistDetailPage({ id, params, page }: { id: string; params: Record<string, string>; page: number }) {
  const tab: Tab = TABS.some((item) => item.id === params.tab) ? (params.tab as Tab) : 'songs'
  const remote = useRemote(`artist:${id}`, () => fetchArtist(id))
  const { busy, start } = usePlayAll()

  usePageTitle(remote.data?.name, '歌手')

  if (!remote.data) return <Remote remote={remote}>{() => null}</Remote>
  const artist = remote.data

  return (
    <>
      <header className="artist-hero panel">
        <div className="artist-hero-bg" style={artist.pic ? { backgroundImage: `url("${coverUrl(artist.pic, 'artist')}")` } : undefined} />
        <Cover className="artist-hero-avatar" src={coverUrl(artist.pic, 'artist')} eager />
        <div className="detail-info">
          <p className="eyebrow">ARTIST · 歌手</p>
          <h1>{artist.name}</h1>
          {artist.alias ? <p className="meta">{artist.alias}</p> : null}
          <div className="artist-stats">
            <span>
              <strong>{formatCount(artist.fans)}</strong>粉丝
            </span>
            <span>
              <strong>{artist.songCount}</strong>单曲
            </span>
            <span>
              <strong>{artist.albumCount}</strong>专辑
            </span>
            <span>
              <strong>{artist.mvCount}</strong>MV
            </span>
          </div>
          <div className="hero-actions">
            <button type="button" className="btn" disabled={busy !== ''} onClick={() => void start(id, () => fetchArtistSongs(id, 1, SONG_SIZE).then((data) => data.songs))}>
              <Icon name="play" size={16} />
              播放热门歌曲
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void shareCurrentPage(artist.name)}>
              <Icon name="share" size={16} />
              分享
            </button>
          </div>
        </div>
      </header>
      <section className="panel">
        <div className="tabs" role="tablist" aria-label="歌手内容">
          {TABS.map((item) => (
            <a key={item.id} role="tab" aria-selected={item.id === tab} className={item.id === tab ? 'active' : undefined} href={hashWith(`/artist/${id}`, { tab: item.id === 'songs' ? '' : item.id })}>
              {item.name}
            </a>
          ))}
        </div>
        {tab === 'songs' ? <Songs id={id} page={page} /> : null}
        {tab === 'albums' ? <Albums id={id} page={page} /> : null}
        {tab === 'info' ? <Info artist={artist} /> : null}
      </section>
    </>
  )
}
