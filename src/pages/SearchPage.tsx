import { useEffect, useRef, useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../components/EmptyState'
import { Icon } from '../components/Icon'
import { Pager } from '../components/Pager'
import { usePlayer } from '../components/PlayerProvider'
import { SongList } from '../components/SongList'
import { FALLBACK_KEYWORDS } from '../data/brand'
import { fetchHotKeywords, NETWORK_TIP } from '../lib/kuwo'
import { addSearchHistory, clearSearchHistory, getSearchHistory, removeSearchHistory } from '../lib/library'
import { getMediaUrl } from '../lib/play'
import { searchHash } from '../lib/route'
import { isSongWithoutMv, peekSearch, rememberNoMv, searchKey, searchMusic, subscribeNoMv, type MusicItem } from '../lib/search'
import { useRemote } from '../lib/useRemote'

const PAGE_SIZE = 20
const FOCUS_KEY = 'fmusic_website_search_focus'

function saveSearchFocus(query: string, id: string) {
  sessionStorage.setItem(FOCUS_KEY, JSON.stringify({ query, id }))
}

function searchFocusId(query: string) {
  try {
    const data = JSON.parse(sessionStorage.getItem(FOCUS_KEY) || '') as { query?: string; id?: string }
    return data.query === query ? String(data.id || '') : ''
  } catch {
    return ''
  }
}

function revealSearchRow(id: string) {
  const row = document.getElementById(`search-song-${id}`)
  if (!row) return
  const topBar = document.querySelector('.sticky-top')?.getBoundingClientRect().height ?? 0
  const dock = document.querySelector('.player-stack')?.getBoundingClientRect().height ?? 0
  const rect = row.getBoundingClientRect()
  const visible = rect.top >= topBar + 8 && rect.bottom <= window.innerHeight - dock - 8
  if (!visible) row.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

export function SearchPage({ q, page }: { q: string; page: number }) {
  const [input, setInput] = useState(q)
  const [songs, setSongs] = useState<MusicItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)
  const [suggests, setSuggests] = useState<string[]>([])
  const [history, setHistory] = useState<string[]>(() => getSearchHistory())
  const [focused, setFocused] = useState(false)
  const blurTimer = useRef(0)
  const probedMv = useRef(new Set<string>())
  const player = usePlayer()
  const hot = useRemote('hot-keywords', fetchHotKeywords)
  const hotWords = hot.data?.length ? hot.data : hot.error ? FALLBACK_KEYWORDS : []

  useEffect(
    () =>
      subscribeNoMv(() => {
        setSongs((list) => list.map((item) => (isSongWithoutMv(item.id) ? { ...item, hasMv: false } : item)))
      }),
    [],
  )

  useEffect(() => {
    for (const song of songs) {
      if (!song.hasMv || probedMv.current.has(song.id)) continue
      probedMv.current.add(song.id)
      void getMediaUrl(song.id, 'mv', 'fhd', song.mvId ?? '').catch((reason: unknown) => {
        if (reason instanceof Error && reason.message.includes('没有')) rememberNoMv(song.id)
      })
    }
  }, [songs])

  useEffect(() => setInput(q), [q])

  useEffect(() => {
    const keyword = q.trim()
    if (!keyword) return
    addSearchHistory(keyword)
    setHistory(getSearchHistory())
  }, [q])

  useEffect(() => {
    const keyword = input.trim()
    if (!focused || !keyword) {
      setSuggests([])
      return
    }
    const timer = window.setTimeout(() => {
      searchKey(keyword)
        .then(setSuggests)
        .catch(() => setSuggests([]))
    }, 160)
    return () => window.clearTimeout(timer)
  }, [input, focused])

  useEffect(() => {
    const keyword = q.trim()
    if (!keyword) {
      setSongs([])
      setTotal(0)
      setError('')
      return
    }
    const cached = peekSearch(keyword, page - 1, PAGE_SIZE)
    if (cached) {
      setSongs(cached.list)
      setTotal(cached.total || cached.list.length)
      setLoading(false)
      setError('')
      return
    }
    let cancel = false
    setLoading(true)
    setError('')
    searchMusic(keyword, page - 1, PAGE_SIZE)
      .then((result) => {
        if (cancel) return
        setSongs(result.list)
        setTotal(result.total || result.list.length)
      })
      .catch(() => {
        if (cancel) return
        setSongs([])
        setTotal(0)
        setError(NETWORK_TIP)
      })
      .finally(() => {
        if (!cancel) setLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [q, page, tick])

  useEffect(() => {
    if (!q.trim() || !total) return
    const last = Math.max(1, Math.ceil(total / PAGE_SIZE))
    if (page > last) window.location.hash = searchHash(q, last)
  }, [q, page, total])

  const go = (keyword: string) => {
    const next = keyword.trim()
    player.dismissLyric()
    window.location.hash = next ? searchHash(next) : '#/search'
    setSuggests([])
  }

  const playSong = (song: MusicItem, kind: 'audio' | 'mv') => {
    saveSearchFocus(q, song.id)
    player.play(song, kind, kind === 'audio' ? songs : undefined)
  }

  useEffect(() => {
    const id = songs.some((song) => song.id === player.playingId) ? player.playingId : searchFocusId(q)
    if (!id || !songs.some((song) => song.id === id)) return
    const frame = window.requestAnimationFrame(() => revealSearchRow(id))
    return () => window.cancelAnimationFrame(frame)
  }, [player.playingId, songs, q, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <header className="search-hero">
        <p className="eyebrow">SEARCH</p>
        <h1>搜一首歌，遇见好心情</h1>
        <form
          role="search"
          className="search-big"
          onSubmit={(event) => {
            event.preventDefault()
            go(input)
          }}
        >
          <div className="search-box">
            <Icon name="search" size={18} className="search-icon" />
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onFocus={() => {
                window.clearTimeout(blurTimer.current)
                player.dismissLyric()
                setFocused(true)
              }}
              onBlur={() => {
                blurTimer.current = window.setTimeout(() => setFocused(false), 120)
              }}
              placeholder="歌名、歌手或专辑"
              aria-label="搜索关键词"
              aria-autocomplete="list"
              aria-expanded={focused && suggests.length > 0}
            />
            {suggests.length ? (
              <ul className="suggest-list is-floating">
                {suggests.map((item) => (
                  <li key={item}>
                    <button type="button" onClick={() => go(item)}>
                      <Icon name="search" size={14} />
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <button className="btn btn-lg" type="submit">
            搜索
          </button>
        </form>
        <div className="search-words">
          <div className="search-words-block">
            <div className="search-words-head">
              <span>大家都在搜</span>
            </div>
            <div className="chip-row">
              {hotWords.slice(0, 12).map((item, index) => (
                <a key={item} className={index < 3 ? 'chip is-hot' : 'chip'} href={searchHash(item)}>
                  {index < 3 ? <Icon name="fire" size={13} /> : null}
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div className="search-words-block">
            <div className="search-words-head">
              <span>搜索历史</span>
              {history.length ? (
                <button
                  type="button"
                  onClick={() => {
                    clearSearchHistory()
                    setHistory([])
                  }}
                >
                  清空
                </button>
              ) : null}
            </div>
            {history.length ? (
              <div className="chip-row">
                {history.map((item) => (
                  <span key={item} className="history-chip">
                    <a className="chip" href={searchHash(item)}>
                      {item}
                    </a>
                    <button
                      type="button"
                      aria-label={`删除 ${item}`}
                      onClick={() => {
                        removeSearchHistory(item)
                        setHistory(getSearchHistory())
                      }}
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="meta">搜过的词会留在这里。</p>
            )}
          </div>
        </div>
      </header>

      {!q ? (
        <EmptyState title="想听什么？写个歌名，或点一个大家都在搜的词。" hint="例如：晴天、周杰伦、孤勇者。" />
      ) : loading && songs.length === 0 ? (
        <LoadingState />
      ) : error && songs.length === 0 ? (
        <ErrorState text={error} onRetry={() => setTick((value) => value + 1)} />
      ) : songs.length === 0 ? (
        <EmptyState title="没找到这首歌，换个关键词试试？" hint="试试只写歌名，或者换成歌手的名字。" />
      ) : (
        <section className="panel">
          <div className="list-head">
            <h2>
              「{q}」的搜索结果
              <small>
                共 {total} 首 · 第 {page} / {totalPages} 页{loading ? ' · 正在更新…' : ''}
              </small>
            </h2>
          </div>
          <SongList songs={songs} start={(page - 1) * PAGE_SIZE} rowIdPrefix="search-song-" onPlay={playSong} />
          <Pager page={page} totalPages={totalPages} hrefFor={(n) => searchHash(q, n)} label="搜索分页" />
        </section>
      )}
    </>
  )
}
