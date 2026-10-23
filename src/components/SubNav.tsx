import type { Route } from '../lib/route'

const items: { href: string; label: string; names: Route['name'][] }[] = [
  { href: '#/discover', label: '推荐', names: ['discover'] },
  { href: '#/toplist', label: '排行榜', names: ['toplist'] },
  { href: '#/playlists', label: '歌单', names: ['playlists', 'playlist'] },
  { href: '#/artists', label: '歌手', names: ['artists', 'artist'] },
  { href: '#/albums', label: '新碟上架', names: ['albums', 'album'] },
]

export function SubNav({ route }: { route: Route }) {
  return (
    <nav className="subnav" aria-label="发现音乐">
      <div className="wrap subnav-inner">
        {items.map((item) => (
          <a key={item.href} href={item.href} className={item.names.includes(route.name) ? 'active' : ''}>
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
