import { Cover } from '../components/Cover'
import { Icon } from '../components/Icon'
import { PageHero } from '../components/PageHero'
import { Remote } from '../components/Remote'
import { SectionHead } from '../components/SectionHead'
import { SongList } from '../components/SongList'
import { toneStyle } from '../components/StationCard'
import { AlbumTile, ArtistTile } from '../components/Tiles'
import { usePlayAll } from '../components/usePlayAll'
import { PAGE_COPY } from '../data/brand'
import { getDailyMix } from '../lib/daily'
import { fetchArtists, fetchChartGroups, fetchChartSongs, fetchNewAlbums, fetchTagGroups } from '../lib/kuwo'
import { tagSongs } from '../lib/radio'
import { hashWith } from '../lib/route'
import { coverUrl } from '../lib/search'
import { useRemote } from '../lib/useRemote'

const MOOD_TONES: [string, string][] = [
  ['#6366F1', '#B34DFF'],
  ['#38BDF8', '#2DD4BF'],
  ['#F59E0B', '#F04D9A'],
  ['#F04D9A', '#B34DFF'],
  ['#8B5CF6', '#38BDF8'],
  ['#F97316', '#F04D9A'],
  ['#22D3EE', '#6366F1'],
  ['#B34DFF', '#F04D9A'],
]

function Moods() {
  const groups = useRemote('pl:tags', fetchTagGroups)
  const { busy, start } = usePlayAll()
  const moods = groups.data?.find((group) => group.name.includes('心情'))?.tags.slice(0, 8) ?? []

  return (
    <section className="page-section">
      <SectionHead title="此刻的心情" en="MOOD" desc="选一种心情，剩下的交给音乐。" more="#/playlists" moreLabel="全部分类" />
      <Remote remote={groups}>
        {() => (
          <div className="mood-grid">
            {moods.map((tag, index) => (
              <article key={tag.id} className="mood-card" style={toneStyle(MOOD_TONES[index % MOOD_TONES.length] ?? ['#8B5CF6', '#F04D9A'])}>
                <a href={hashWith('/playlists', { tag: tag.id })}>
                  <strong>{tag.name}</strong>
                  <span>相关歌单</span>
                </a>
                <button type="button" className="theme-play" aria-label={`随便听听「${tag.name}」`} disabled={busy !== ''} onClick={() => void start(tag.id, () => tagSongs(tag.id))}>
                  {busy === tag.id ? <span className="spinner" aria-hidden="true" /> : <Icon name="play" size={16} />}
                </button>
              </article>
            ))}
          </div>
        )}
      </Remote>
    </section>
  )
}

function Categories() {
  const groups = useRemote('pl:tags', fetchTagGroups)
  return (
    <section className="page-section">
      <SectionHead title="风格与场景" en="EXPLORE" desc="从年代、曲风到语种，按图索骥找宝藏。" />
      <Remote remote={groups} compact>
        {(list) => (
          <div className="category-panel">
            {list
              .filter((group) => !group.name.includes('心情'))
              .map((group) => (
                <div key={group.name} className="category-row">
                  <h3>{group.name}</h3>
                  <div className="chip-row">
                    {group.tags.map((tag) => (
                      <a key={tag.id} className="chip" href={hashWith('/playlists', { tag: tag.id })}>
                        {tag.name}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </Remote>
    </section>
  )
}

function NewAlbums() {
  const remote = useRemote('album:new', fetchNewAlbums)
  return (
    <section className="page-section">
      <SectionHead title="新碟上架" en="NEW ALBUMS" desc="新鲜音乐准时上架，让耳朵保持新鲜感。" more="#/albums" />
      <Remote remote={remote}>
        {(list) => (
          <div className="tile-grid is-six">
            {list.slice(0, 6).map((item) => (
              <AlbumTile key={item.id} item={item} />
            ))}
          </div>
        )}
      </Remote>
    </section>
  )
}

function HotArtists() {
  const remote = useRemote('artist:list:0:1:12', () => fetchArtists('0', 1, 12))
  return (
    <section className="page-section">
      <SectionHead title="热门歌手" en="ARTISTS" desc="从一个声音，走进一个人的音乐世界。" more="#/artists" />
      <Remote remote={remote}>
        {(page) => (
          <div className="artist-grid">
            {page.list.slice(0, 12).map((item) => (
              <ArtistTile key={item.id} item={item} />
            ))}
          </div>
        )}
      </Remote>
    </section>
  )
}

function GlobalCharts() {
  const menu = useRemote('chart:menu', fetchChartGroups)
  return (
    <section className="page-section">
      <SectionHead title="全球榜单" en="GLOBAL" desc="从 Billboard 到日本公信榜，听听世界在流行什么。" more="#/toplist" moreLabel="全部榜单" />
      <Remote remote={menu}>
        {(groups) => {
          const global = groups.find((group) => group.name.includes('全球')) ?? groups[groups.length - 1]
          return (
            <div className="chart-cards">
              {(global?.charts ?? []).slice(0, 6).map((chart) => (
                <a key={chart.id} className="chart-card" href={`#/toplist/${chart.id}`}>
                  <Cover src={coverUrl(chart.pic)} alt="" />
                  <span>
                    <strong>{chart.name}</strong>
                    <small>{chart.pub || '每周更新'}</small>
                  </span>
                </a>
              ))}
            </div>
          )
        }}
      </Remote>
    </section>
  )
}

function Trending() {
  const remote = useRemote('chart:187:1:30', () => fetchChartSongs('187', 1, 30))
  return (
    <section className="page-section">
      <SectionHead title="宝藏新声" en="RISING" desc="还没火遍全网，但已经在悄悄流行。" more="#/toplist/187" />
      <Remote remote={remote}>{(page) => <SongList songs={page.songs.slice(0, 10)} queue={page.songs} />}</Remote>
    </section>
  )
}

export function DiscoverPage() {
  const { busy, start } = usePlayAll()
  return (
    <>
      <PageHero copy={PAGE_COPY.discover}>
        <button type="button" className="btn btn-lg" disabled={busy !== ''} onClick={() => void start('daily', () => getDailyMix().then((mix) => mix.songs))}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="play" size={18} />}
          来点惊喜
        </button>
        <a className="btn btn-lg btn-ghost" href="#/toplist/93">
          看看飙升榜
        </a>
      </PageHero>
      <Moods />
      <NewAlbums />
      <Trending />
      <HotArtists />
      <GlobalCharts />
      <Categories />
    </>
  )
}
