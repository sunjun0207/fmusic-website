import { ArtistGrid } from '../components/ArtistGrid'
import { ARTIST_REGIONS, artists } from '../data/catalog'

export function ArtistsPage({ tag }: { tag: string }) {
  const current = (ARTIST_REGIONS as readonly string[]).includes(tag) ? tag : '全部'
  const items = current === '全部' ? artists : artists.filter((item) => item.region === current)

  return (
    <>
      <header className="page-intro">
        <h1>歌手</h1>
        <p>点进去可以看编辑列出的歌。想听更多，用顶部搜索框搜歌手名。</p>
      </header>
      <div className="chips" aria-label="歌手地区">
        {ARTIST_REGIONS.map((item) => (
          <a
            key={item}
            className={item === current ? 'chip active' : 'chip'}
            href={item === '全部' ? '#/artists' : `#/artists?tag=${encodeURIComponent(item)}`}
          >
            {item}
          </a>
        ))}
      </div>
      <ArtistGrid items={items} />
    </>
  )
}
