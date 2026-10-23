import { useEffect, useState } from 'react'
import { searchHash, type Route } from '../lib/route'

const DISCOVER = new Set<Route['name']>([
  'discover',
  'toplist',
  'playlists',
  'playlist',
  'artists',
  'artist',
  'albums',
  'album',
  'search',
])

export function SiteHeader({ route }: { route: Route }) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('hashchange', close)
    return () => window.removeEventListener('hashchange', close)
  }, [])

  return (
    <header className="site-header">
      <div className={`wrap header-inner${open ? ' open' : ''}`}>
        <a className="logo" href="#/discover">
          <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="16" fill="#1aa6a0" />
            <circle cx="18" cy="18" r="7" fill="none" stroke="#0b1f24" strokeWidth="1.4" />
            <circle cx="18" cy="18" r="2.2" fill="#0b1f24" />
          </svg>
          <span className="logo-text">
            <small>聆听</small>
            jun.sun
          </span>
        </a>
        <nav className="main-nav" aria-label="主导航">
          <a className={DISCOVER.has(route.name) ? 'active' : ''} href="#/discover">
            发现音乐
          </a>
          <a className={route.name === 'download' ? 'active' : ''} href="#/download">
            听歌说明
          </a>
          <a className={route.name === 'about' ? 'active' : ''} href="#/about">
            关于
          </a>
        </nav>
        <form
          className="search-form"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            const q = keyword.trim()
            if (!q) return
            window.location.hash = searchHash(q)
          }}
        >
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索歌曲、歌手、歌单"
            aria-label="搜索"
          />
          <button type="submit">搜索</button>
        </form>
        <a className="header-search" href="#/search" aria-label="搜索">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </a>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-label={open ? '关闭菜单' : '打开菜单'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
