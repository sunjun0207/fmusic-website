import { useEffect, useRef, useState } from 'react'
import { FALLBACK_KEYWORDS, NAV } from '../data/brand'
import { fetchHotKeywords } from '../lib/kuwo'
import { clearSearchHistory, getNickname, getSearchHistory } from '../lib/library'
import { searchHash, type Route } from '../lib/route'
import { searchKey } from '../lib/search'
import { useLibraryVersion } from '../lib/useLibrary'
import { Icon } from './Icon'
import { Logo } from './Logo'
import { usePlayer } from './PlayerProvider'

export function SiteHeader({ route }: { route: Route }) {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState(route.name === 'search' ? route.q : '')
  const [suggests, setSuggests] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [hot, setHot] = useState<string[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const slotRef = useRef<HTMLDivElement>(null)
  const player = usePlayer()
  useLibraryVersion()
  const nickname = getNickname()

  useEffect(() => {
    setOpen(false)
    setKeyword(route.name === 'search' ? route.q : '')
    setSuggestOpen(false)
  }, [route.key, route.name, route.q])

  useEffect(() => {
    if (!suggestOpen) return
    setHistory(getSearchHistory())
    if (!hot.length) {
      fetchHotKeywords()
        .then((words) => setHot(words.length ? words : FALLBACK_KEYWORDS))
        .catch(() => setHot(FALLBACK_KEYWORDS))
    }
  }, [suggestOpen, hot.length])

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
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSuggestOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const go = (value: string) => {
    const q = value.trim()
    if (!q) return
    player.dismissLyric()
    setKeyword(q)
    setSuggestOpen(false)
    window.location.hash = searchHash(q)
  }

  const typing = keyword.trim() !== ''
  const showPanel = suggestOpen && (typing ? suggests.length > 0 : history.length > 0 || hot.length > 0)

  return (
    <header className="site-header">
      <div className={`wrap header-inner${open ? ' is-open' : ''}`}>
        <Logo />
        <nav className="main-nav" aria-label="主导航">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={item.names.includes(route.name) ? 'active' : undefined} aria-current={item.names.includes(route.name) ? 'page' : undefined}>
              {item.label}
            </a>
          ))}
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
            <Icon name="search" size={16} className="search-icon" />
            <input
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value)
                setSuggestOpen(true)
              }}
              onFocus={() => {
                player.dismissLyric()
                setSuggestOpen(true)
              }}
              placeholder="搜一首歌，遇见好心情"
              aria-label="搜索歌曲、歌手"
              aria-autocomplete="list"
              aria-expanded={showPanel}
            />
          </form>
          {showPanel ? (
            <div className="suggest-panel" role="listbox" aria-label={typing ? '搜索建议' : '搜索历史和热门搜索'}>
              {typing ? (
                <ul className="suggest-list">
                  {suggests.map((item) => (
                    <li key={item}>
                      <button type="button" role="option" aria-selected={false} onClick={() => go(item)}>
                        <Icon name="search" size={14} />
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  {history.length ? (
                    <div className="suggest-block">
                      <div className="suggest-label">
                        <span>搜索历史</span>
                        <button
                          type="button"
                          onClick={() => {
                            clearSearchHistory()
                            setHistory([])
                          }}
                        >
                          清空
                        </button>
                      </div>
                      <div className="chip-row">
                        {history.slice(0, 8).map((item) => (
                          <button key={item} type="button" className="chip" onClick={() => go(item)}>
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {hot.length ? (
                    <div className="suggest-block">
                      <div className="suggest-label">
                        <span>大家都在搜</span>
                      </div>
                      <ol className="hot-words">
                        {hot.slice(0, 10).map((item, index) => (
                          <li key={item}>
                            <button type="button" role="option" aria-selected={false} onClick={() => go(item)}>
                              <span className={index < 3 ? 'rank is-top' : 'rank'}>{index + 1}</span>
                              {item}
                            </button>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>
        <a className={route.name === 'mine' ? 'header-mine active' : 'header-mine'} href="#/mine" aria-label="我的音乐">
          <span className="header-avatar">
            <Icon name="user" size={16} />
          </span>
          <span className="header-mine-text">{nickname || '我的音乐'}</span>
        </a>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-label={open ? '关闭菜单' : '打开菜单'}
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </div>
    </header>
  )
}
