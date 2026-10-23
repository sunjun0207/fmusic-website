import { charts, EDITORIAL_NOTE, getChart, getTracks } from '../data/catalog'
import { EmptyState } from '../components/EmptyState'
import { CoverArt } from '../components/CoverArt'
import { SongTable } from '../components/SongTable'

export function ToplistPage({ id }: { id?: string }) {
  const current = (id ? getChart(id) : undefined) ?? charts[0]
  if (!current) {
    return <EmptyState title="还没有榜单。" href="#/discover" action="回到推荐" />
  }
  if (id && !getChart(id)) {
    return <EmptyState title="没有这张榜单。" href="#/toplist" action="查看全部榜单" />
  }
  const tracks = getTracks(current.trackIds)

  return (
    <>
      <header className="page-intro">
        <h1>排行榜</h1>
        <p>三张编辑榜单，方便你按心情接着搜。数字是编排顺序，不是播放量。</p>
      </header>
      <div className="toplist-layout">
        <aside className="side-list">
          {charts.map((chart) => (
            <a key={chart.id} href={`#/toplist/${chart.id}`} className={chart.id === current.id ? 'active' : ''}>
              {chart.title}
            </a>
          ))}
        </aside>
        <div>
          <div className="detail-head">
            <CoverArt cover={current.cover} />
            <div>
              <h2>{current.title}</h2>
              <p>{current.desc}</p>
              <p className="meta">
                编辑于 {current.updated} · {tracks.length} 首
              </p>
            </div>
          </div>
          <SongTable tracks={tracks} />
          <p className="note">{EDITORIAL_NOTE}</p>
        </div>
      </div>
    </>
  )
}
