import type { Artist } from '../data/catalog'
import { CoverArt } from './CoverArt'

export function ArtistGrid({ items }: { items: Artist[] }) {
  return (
    <div className="artist-grid">
      {items.map((item) => (
        <a key={item.id} className="artist-card" href={`#/artist/${item.id}`}>
          <CoverArt cover={item.cover} round />
          <strong>{item.name}</strong>
          <span>{item.region}</span>
        </a>
      ))}
    </div>
  )
}
