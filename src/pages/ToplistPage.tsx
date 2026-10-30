import { useEffect, useRef, useState } from 'react'
import { Cover } from '../components/Cover'
import { EmptyState, ErrorState, LoadingState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { PageHero } from '../components/PageHero'
import { SongList } from '../components/SongList'
import { usePlayAll } from '../components/usePlayAll'
import { PAGE_COPY } from '../data/brand'
import { fetchChartGroups, fetchChartSongs, type ChartInfo, type ChartPage } from '../lib/kuwo'
import { coverUrl } from '../lib/search'
import { shareCurrentPage } from '../lib/share'
import { usePageTitle } from '../lib/title'
import { useRemote } from '../lib/useRemote'

const STEP = 30

/** 一页一页地拉，拉过的页走缓存，「加载更多」只多请求新的一页。 */
async function loadPages(id: string, pages: number): Promise<ChartPage> {
  const list = await Promise.all(Array.from({ length: pages }, (_, index) => fetchChartSongs(id, index + 1, STEP)))
  const seen = new Set<string>()
  const merged: ChartPage = { songs: [], trends: {}, total: list[0]?.total ?? 0, pub: list[0]?.pub ?? '' }
  for (const page of list) {
    for (const song of page.songs) {
      if (seen.has(song.id)) continue
      seen.add(song.id)
      merged.songs.push(song)
      const trend = page.trends[song.id]
      if (trend) merged.trends[song.id] = trend
    }
  }
  return merged
}

export function ToplistPage({ id }: { id?: string }) {
  const menu = useRemote('chart:menu', fetchChartGroups)
  const groups = menu.data ?? []
  const all = groups.flatMap((group) => group.charts)
  const chart: ChartInfo | undefined = all.find((item) => item.id === id) ?? (id ? { id, name: '排行榜', intro: '', pic: '', pub: '' } : all[0])
  const chartId = chart?.id ?? ''
  const [pages, setPages] = useState(1)
  const { busy, start } = usePlayAll()

  useEffect(() => setPages(1), [chartId])

  const remote = useRemote(`chart-pages:${chartId}:${pages}`, () => loadPages(chartId, pages), chartId !== '')
  const kept = useRef<{ id: string; page: ChartPage } | null>(null)
  if (remote.data) kept.current = { id: chartId, page: remote.data }
  const page = remote.data ?? (kept.current?.id === chartId ? kept.current.page : undefined)
  const hasMore = page ? page.songs.length < page.total && page.songs.length >= pages * STEP - 5 && pages < 10 : false

  usePageTitle(chart?.name, '排行榜')

  return (
    <>
      <PageHero copy={PAGE_COPY.toplist} compact />
      <div className="toplist-layout">
        <aside className="toplist-aside" aria-label="榜单列表">
          {!menu.data ? (
            menu.error ? (
              <ErrorState text={menu.error} onRetry={menu.reload} />
            ) : (
              <LoadingState compact />
            )
          ) : (
            groups.map((group) => (
              <div key={group.name} className="toplist-group">
                <h3>{group.name}</h3>
                <ul>
                  {group.charts.map((item) => (
                    <li key={item.id}>
                      <a href={`#/toplist/${item.id}`} className={item.id === chartId ? 'active' : undefined} aria-current={item.id === chartId ? 'page' : undefined}>
                        <Cover className="toplist-thumb" src={coverUrl(item.pic)} />
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.pub || '每日更新'}</small>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </aside>
        <section className="panel toplist-main">
          {chart ? (
            <header className="detail-head is-chart">
              <Cover className="detail-cover" src={coverUrl(chart.pic)} eager />
              <div className="detail-info">
                <p className="eyebrow">TOP CHARTS</p>
                <h2>{chart.name}</h2>
                <p className="meta">
                  {page?.pub || chart.pub ? `最近更新：${page?.pub || chart.pub}` : '每日更新'}
                  {page ? ` · 共 ${page.total} 首` : ''}
                </p>
                {chart.intro ? <p className="detail-intro">{chart.intro}</p> : null}
                <div className="hero-actions">
                  <button type="button" className="btn" disabled={busy !== '' || !page?.songs.length} onClick={() => void start(chartId, () => page?.songs ?? [])}>
                    <Icon name="play" size={16} />
                    播放全部
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => void shareCurrentPage(chart.name)}>
                    <Icon name="share" size={16} />
                    分享榜单
                  </button>
                </div>
              </div>
            </header>
          ) : null}
          {page ? (
            <>
              <SongList songs={page.songs} ranked trends={page.trends} />
              {hasMore ? (
                <button type="button" className="btn btn-ghost load-more" disabled={remote.loading} onClick={() => setPages((value) => value + 1)}>
                  {remote.loading ? '正在为你寻找好声音……' : '加载更多'}
                </button>
              ) : null}
              {remote.error && remote.data === undefined ? <ErrorState text={remote.error} onRetry={remote.reload} /> : null}
            </>
          ) : remote.error ? (
            <ErrorState text={remote.error} onRetry={remote.reload} />
          ) : menu.data && !chart ? (
            <EmptyState title="榜单暂时没有更新" />
          ) : (
            <LoadingState />
          )}
        </section>
      </div>
    </>
  )
}
