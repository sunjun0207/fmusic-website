import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { PageHero } from '../components/PageHero'
import { Pager } from '../components/Pager'
import { Remote } from '../components/Remote'
import { PlaylistGrid } from '../components/Tiles'
import { PAGE_COPY } from '../data/brand'
import { fetchPlaylists, fetchTagGroups } from '../lib/kuwo'
import { hashWith } from '../lib/route'
import { usePageTitle } from '../lib/title'
import { useRemote } from '../lib/useRemote'

const SIZE = 30
const QUICK_TAGS = [
  { id: '37', name: '华语' },
  { id: '393', name: '流行' },
  { id: '146', name: '伤感' },
  { id: '67', name: '安静' },
  { id: '392', name: '民谣' },
  { id: '391', name: '电子' },
  { id: '389', name: '摇滚' },
  { id: '127', name: '古风' },
  { id: '366', name: '运动' },
  { id: '1876', name: '学习' },
]

export function PlaylistsPage({ params, page }: { params: Record<string, string>; page: number }) {
  const tag = params.tag ?? ''
  const order = params.order === 'new' ? 'new' : 'hot'
  const [open, setOpen] = useState(false)
  const groups = useRemote('pl:tags', fetchTagGroups)
  const list = useRemote(`pl:list:${tag}:${order}:${page}:${SIZE}`, () => fetchPlaylists({ tag, order, page, size: SIZE }))
  const tagName = tag ? (groups.data?.flatMap((group) => group.tags).find((item) => item.id === tag)?.name ?? QUICK_TAGS.find((item) => item.id === tag)?.name ?? '分类歌单') : '全部歌单'
  const totalPages = Math.min(50, Math.ceil((list.data?.total ?? 0) / SIZE))

  usePageTitle(tag ? tagName : '', '歌单')
  useEffect(() => setOpen(false), [tag])

  return (
    <>
      <PageHero copy={PAGE_COPY.playlists} compact />
      <section className="panel">
        <div className="filter-bar">
          <div className="filter-current">
            <h2>{tagName}</h2>
            <button type="button" className={open ? 'chip is-active' : 'chip'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
              选择分类
              <Icon name={open ? 'close' : 'chevronRight'} size={13} />
            </button>
          </div>
          {!tag ? (
            <div className="tabs is-small" role="tablist" aria-label="排序">
              <a role="tab" aria-selected={order === 'hot'} className={order === 'hot' ? 'active' : undefined} href={hashWith('/playlists', {})}>
                最热
              </a>
              <a role="tab" aria-selected={order === 'new'} className={order === 'new' ? 'active' : undefined} href={hashWith('/playlists', { order: 'new' })}>
                最新
              </a>
            </div>
          ) : null}
        </div>
        <div className="chip-row quick-tags">
          <a className={tag ? 'chip' : 'chip is-active'} href="#/playlists">
            全部
          </a>
          {QUICK_TAGS.map((item) => (
            <a key={item.id} className={item.id === tag ? 'chip is-active' : 'chip'} href={hashWith('/playlists', { tag: item.id })}>
              {item.name}
            </a>
          ))}
        </div>
        {open ? (
          <div className="category-panel is-popover">
            <Remote remote={groups} compact>
              {(data) =>
                data.map((group) => (
                  <div key={group.name} className="category-row">
                    <h3>{group.name}</h3>
                    <div className="chip-row">
                      {group.tags.map((item) => (
                        <a key={item.id} className={item.id === tag ? 'chip is-active' : 'chip'} href={hashWith('/playlists', { tag: item.id })}>
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ))
              }
            </Remote>
          </div>
        ) : null}
        <Remote remote={list}>
          {(data) => (
            <>
              <PlaylistGrid items={data.list} className="is-six" />
              <Pager page={page} totalPages={totalPages} hrefFor={(n) => hashWith('/playlists', { tag, order: order === 'new' ? 'new' : undefined, page: n })} label="歌单分页" />
            </>
          )}
        </Remote>
      </section>
    </>
  )
}
