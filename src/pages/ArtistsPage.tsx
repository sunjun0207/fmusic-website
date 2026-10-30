import { PageHero } from '../components/PageHero'
import { Pager } from '../components/Pager'
import { Remote } from '../components/Remote'
import { ArtistTile } from '../components/Tiles'
import { PAGE_COPY } from '../data/brand'
import { ARTIST_CATEGORIES, fetchArtists } from '../lib/kuwo'
import { hashWith } from '../lib/route'
import { usePageTitle } from '../lib/title'
import { useRemote } from '../lib/useRemote'

const SIZE = 30

export function ArtistsPage({ params, page }: { params: Record<string, string>; page: number }) {
  const category = ARTIST_CATEGORIES.find((item) => item.id === params.cat) ?? ARTIST_CATEGORIES[0]
  const remote = useRemote(`artist:list:${category.id}:${page}:${SIZE}`, () => fetchArtists(category.id, page, SIZE))
  const totalPages = Math.min(30, Math.ceil((remote.data?.total ?? 0) / SIZE))

  usePageTitle(category.id === '0' ? '' : category.name, '歌手')

  return (
    <>
      <PageHero copy={PAGE_COPY.artists} compact />
      <section className="panel">
        <div className="chip-row quick-tags" role="tablist" aria-label="歌手分类">
          {ARTIST_CATEGORIES.map((item) => (
            <a key={item.id} role="tab" aria-selected={item.id === category.id} className={item.id === category.id ? 'chip is-active' : 'chip'} href={hashWith('/artists', { cat: item.id === '0' ? '' : item.id })}>
              {item.name}
            </a>
          ))}
        </div>
        <Remote remote={remote}>
          {(data) => (
            <>
              <div className="artist-grid">
                {data.list.map((item) => (
                  <ArtistTile key={item.id} item={item} />
                ))}
              </div>
              <Pager page={page} totalPages={totalPages} hrefFor={(n) => hashWith('/artists', { cat: category.id === '0' ? '' : category.id, page: n })} label="歌手分页" />
            </>
          )}
        </Remote>
      </section>
    </>
  )
}
