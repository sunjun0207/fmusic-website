import { PageHero } from '../components/PageHero'
import { Pager } from '../components/Pager'
import { Remote } from '../components/Remote'
import { AlbumTile } from '../components/Tiles'
import { PAGE_COPY } from '../data/brand'
import { fetchNewAlbums } from '../lib/kuwo'
import { hashWith } from '../lib/route'
import { useRemote } from '../lib/useRemote'

const SIZE = 30

export function AlbumsPage({ page }: { page: number }) {
  const remote = useRemote('album:new', fetchNewAlbums)

  return (
    <>
      <PageHero copy={PAGE_COPY.albums} compact />
      <section className="panel">
        <div className="list-head">
          <h2>
            新碟上架<small>按发行日期排序，来自新歌榜、会员新歌榜与网红新歌榜</small>
          </h2>
        </div>
        <Remote remote={remote}>
          {(list) => {
            const totalPages = Math.max(1, Math.ceil(list.length / SIZE))
            const current = Math.min(page, totalPages)
            return (
              <>
                <div className="tile-grid is-six">
                  {list.slice((current - 1) * SIZE, current * SIZE).map((item) => (
                    <AlbumTile key={item.id} item={item} />
                  ))}
                </div>
                <Pager page={current} totalPages={totalPages} hrefFor={(n) => hashWith('/albums', { page: n })} label="专辑分页" />
              </>
            )
          }}
        </Remote>
      </section>
    </>
  )
}
