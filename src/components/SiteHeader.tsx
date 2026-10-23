import { useEffect, useRef, useState } from 'react'
import { searchHash, type Route } from '../lib/route'
import { searchKey } from '../lib/search'

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
  const [keyword, setKeyword] = useState(route.name === 'search' ? route.q : '')
  const [suggests, setSuggests] = useState<string[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const slotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('hashchange', close)
    return () => window.removeEventListener('hashchange', close)
  }, [])

  useEffect(() => {
    setKeyword(route.name === 'search' ? route.q : '')
    setSuggestOpen(false)
  }, [route.key])

  useEffect(() => {
    const q = keyword.trim()
    if (!suggestOpen || !q) {
      setSuggests([])
      return
    }
    const timer = window.setTimeout(() => {
      searchKey(q)
        .then(setSuggests)
        .catch(() => setSuggests([]))
    }, 160)
    return () => window.clearTimeout(timer)
  }, [keyword, suggestOpen])

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (!slotRef.current?.contains(event.target as Node)) setSuggestOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [])

  const go = (value: string) => {
    const q = value.trim()
    if (!q) return
    setKeyword(q)
    setSuggestOpen(false)
    window.location.hash = searchHash(q)
  }

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
          <a className={route.name === 'favorites' ? 'active' : ''} href="#/favorites">
            收藏
          </a>
          <a className={route.name === 'download' ? 'active' : ''} href="#/download">
            听歌说明
          </a>
          <a className={route.name === 'about' ? 'active' : ''} href="#/about">
            关于
          </a>
        </nav>
        <div className="search-slot" ref={slotRef}>
          <form
            className="search-form"
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              go(keyword)
            }}
          >
            <input
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value)
                setSuggestOpen(true)
              }}
              onFocus={() => setSuggestOpen(true)}
              placeholder="搜索歌曲、歌手、歌单"
              aria-label="搜索"
              aria-autocomplete="list"
              aria-expanded={suggestOpen && suggests.length > 0}
            />
            <button type="submit">搜索</button>
          </form>
          {suggestOpen && suggests.length ? (
            <ul className="suggest-list header-suggest" role="listbox">
              {suggests.map((item) => (
                <li key={item}>
                  <button type="button" role="option" onClick={() => go(item)}>
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
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
