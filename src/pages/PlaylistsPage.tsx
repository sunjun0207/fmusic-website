import { PlaylistGrid } from '../components/PlaylistGrid'
import { EmptyState } from '../components/EmptyState'
import { PLAYLIST_TAGS, playlists } from '../data/catalog'

export function PlaylistsPage({ tag }: { tag: string }) {
  const current = (PLAYLIST_TAGS as readonly string[]).includes(tag) ? tag : '全部'
  const items = current === '全部' ? playlists : playlists.filter((item) => item.tags.includes(current))

  return (
    <>
      <header className="page-intro">
        <h1>歌单</h1>
        <p>按夜里、雨天、通勤这些场景收好。点进歌单，看编辑挑出的曲目。</p>
      </header>
      <div className="chips" role="tablist" aria-label="歌单分类">
        {PLAYLIST_TAGS.map((item) => (
          <a
            key={item}
            className={item === current ? 'chip active' : 'chip'}
            href={item === '全部' ? '#/playlists' : `#/playlists?tag=${encodeURIComponent(item)}`}
          >
            {item}
          </a>
        ))}
      </div>
      {items.length ? (
        <PlaylistGrid items={items} />
      ) : (
        <EmptyState title="这个分类还没有歌单。" href="#/playlists" action="查看全部" />
      )}
    </>
  )
}
