import { formatCount, freshDate } from '../lib/format'
import { fetchAlbum, fetchPlaylistDetail, type AlbumCard, type ArtistCard, type PlaylistCard } from '../lib/kuwo'
import { coverUrl, withCoverSize } from '../lib/search'
import { Cover } from './Cover'
import { Icon } from './Icon'
import { usePlayAll } from './usePlayAll'

function CoverPlay({ label, busy, onPlay }: { label: string; busy: boolean; onPlay: () => void }) {
  return (
    <button type="button" className="cover-play" aria-label={label} title={label} disabled={busy} onClick={onPlay}>
      {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="play" size={18} />}
    </button>
  )
}

export function PlaylistTile({ item, note }: { item: PlaylistCard; note?: string }) {
  const { busy, start } = usePlayAll()
  return (
    <article className="tile">
      <div className="tile-cover">
        <a href={`#/playlist/${item.id}`} aria-label={item.name} tabIndex={-1}>
          <Cover src={withCoverSize(coverUrl(item.cover), 300)} alt="" />
        </a>
        {item.plays ? (
          <span className="tile-plays">
            <Icon name="headphones" size={12} />
            {formatCount(item.plays)}
          </span>
        ) : null}
        <CoverPlay
          label={`播放歌单「${item.name}」`}
          busy={busy !== ''}
          onPlay={() => void start(item.id, () => fetchPlaylistDetail(item.id).then((detail) => detail.songs))}
        />
      </div>
      <a className="tile-name" href={`#/playlist/${item.id}`} title={item.name}>
        {item.name}
      </a>
      {note ? <span className="tile-meta">{note}</span> : item.creator ? <span className="tile-meta">by {item.creator}</span> : null}
    </article>
  )
}

export function PlaylistGrid({ items, className = '' }: { items: PlaylistCard[]; className?: string }) {
  return (
    <div className={`tile-grid ${className}`}>
      {items.map((item) => (
        <PlaylistTile key={item.id} item={item} />
      ))}
    </div>
  )
}

export function AlbumTile({ item }: { item: AlbumCard }) {
  const { busy, start } = usePlayAll()
  return (
    <article className="tile is-album">
      <div className="tile-cover">
        <a href={`#/album/${item.id}`} aria-label={item.name} tabIndex={-1}>
          <Cover src={withCoverSize(coverUrl(item.pic), 300)} alt="" />
        </a>
        <CoverPlay
          label={`播放专辑「${item.name}」`}
          busy={busy !== ''}
          onPlay={() => void start(item.id, () => fetchAlbum(item.id).then((detail) => detail.songs))}
        />
      </div>
      <a className="tile-name" href={`#/album/${item.id}`} title={item.name}>
        {item.name}
      </a>
      <span className="tile-meta">
        {item.artistId ? <a href={`#/artist/${item.artistId}`}>{item.artist}</a> : item.artist}
        {item.date ? ` · ${freshDate(item.date)}` : ''}
      </span>
    </article>
  )
}

export function ArtistTile({ item }: { item: ArtistCard }) {
  return (
    <a className="artist-tile" href={`#/artist/${item.id}`}>
      <Cover className="artist-avatar" src={coverUrl(item.pic, 'artist')} alt="" />
      <strong>{item.name}</strong>
      <span>{item.fans ? `${formatCount(item.fans)} 粉丝` : `${item.songCount} 首歌`}</span>
    </a>
  )
}
