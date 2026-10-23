import type { Playlist } from '../data/catalog'
import { CoverArt } from './CoverArt'

export function PlaylistGrid({ items }: { items: Playlist[] }) {
  return (
    <div className="pl-grid">
      {items.map((item) => (
        <a key={item.id} className="pl-card" href={`#/playlist/${item.id}`}>
          <CoverArt cover={item.cover} />
          <strong>{item.title}</strong>
          <span>
            {item.trackIds.length} 首 · {item.tags[0]}
          </span>
        </a>
      ))}
    </div>
  )
}
