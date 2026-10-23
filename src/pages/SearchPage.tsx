import { useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { usePlayer } from '../components/PlayerProvider'
import { hotSearches } from '../data/catalog'
import { searchHash } from '../lib/route'
import { coverUrl, formatDuration, peekSearch, searchKey, searchMusic, type MusicItem } from '../lib/search'

const PAGE_SIZE = 20

function pagerPages(current: number, totalPages: number) {
  const wanted = new Set<number>([1, totalPages])
  for (let n = current - 2; n <= current + 2; n += 1) wanted.add(n)
  return [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
}

export function SearchPage({ q, page }: { q: string; page: number }) {
  const [input, setInput] = useState(q)
  const [songs, setSongs] = useState<MusicItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggests, setSuggests] = useState<string[]>([])
  const player = usePlayer()

  useEffect(() => setInput(q), [q])

  useEffect(() => {
    const keyword = input.trim()
    if (!keyword || keyword === q.trim()) {
      setSuggests([])
      return
    }
    const timer = window.setTimeout(() => {
      searchKey(keyword)
        .then(setSuggests)
        .catch(() => setSuggests([]))
    }, 160)
    return () => window.clearTimeout(timer)
  }, [input, q])

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
      .catch((reason: unknown) => {
        if (cancel) return
        setSongs([])
        setTotal(0)
        setError(reason instanceof Error ? reason.message : '搜索失败')
      })
      .finally(() => {
        if (!cancel) setLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [q, page])

  useEffect(() => {
    if (!q.trim() || !total) return
    const last = Math.max(1, Math.ceil(total / PAGE_SIZE))
    if (page > last) window.location.hash = searchHash(q, last)
  }, [q, page, total])

  const go = (keyword: string) => {
    const next = keyword.trim()
    window.location.hash = next ? searchHash(next) : '#/search'
    setSuggests([])
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pages = pagerPages(page, totalPages)

  return (
    <>
      <header className="search-hero">
        <h1>搜索</h1>
        <p>搜歌名或歌手。点击歌曲即可播放，带 MV 的曲目可以看视频。</p>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            go(input)
          }}
        >
          <div className="search-box">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="歌曲、歌手或专辑"
              aria-label="搜索关键词"
              aria-autocomplete="list"
            />
            {suggests.length ? (
              <ul className="suggest-list">
                {suggests.map((item) => (
                  <li key={item}>
                    <button type="button" onClick={() => go(item)}>
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <button className="btn" type="submit">
            搜索
          </button>
        </form>
        <div className="chips">
          {hotSearches.map((item) => (
            <a key={item} className="chip" href={searchHash(item)}>
              {item}
            </a>
          ))}
        </div>
      </header>

      {!q ? (
        <EmptyState title="先写一个歌名，或点上面的词。" hint="例如：夜曲、周杰伦、张杰。" />
      ) : loading && songs.length === 0 ? (
        <EmptyState title={`正在搜索「${q}」`} />
      ) : error && songs.length === 0 ? (
        <EmptyState title="搜索没有完成。" hint={error} />
      ) : songs.length === 0 ? (
        <EmptyState title={`没有找到「${q}」。`} hint="换一个歌名或歌手试试。" />
      ) : (
        <>
          <p className="meta">
            「{q}」共 {total} 首，第 {page} / {totalPages} 页
            {loading ? ' · 正在更新…' : ''}
          </p>
          {player.pending ? <p className="meta">正在获取播放地址…</p> : null}
          {player.error ? <p className="play-error">{player.error}</p> : null}
          <div className="table-wrap">
            <table className="song-table">
              <thead>
                <tr>
                  <th className="col-cover" />
                  <th>歌曲</th>
                  <th>歌手</th>
                  <th className="hide-sm">专辑</th>
                  <th className="hide-sm">时长</th>
                  <th className="col-action">操作</th>
                </tr>
              </thead>
              <tbody>
                {songs.map((song) => {
                  const cover = coverUrl(song.image)
                  const duration = formatDuration(song.duration)
                  const playing = player.playingId === song.id
                  return (
                    <tr
                      key={song.id}
                      className={playing ? 'is-playing is-clickable' : 'is-clickable'}
                      onClick={() => player.play(song, 'audio')}
                      onPointerDown={() => player.warm(song, 'audio')}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          player.play(song, 'audio')
                        }
                      }}
                      tabIndex={0}
                      aria-label={`播放 ${song.title}`}
                    >
                      <td>
                        {cover ? (
                          <img className="song-cover" src={cover} alt="" />
                        ) : (
                          <span className="song-cover song-cover-empty" />
                        )}
                      </td>
                      <td>
                        <div className="song-title">
                          <span>{song.title}</span>
                          {song.hasMv ? <span className="mv-flag">MV</span> : null}
                        </div>
                      </td>
                      <td>{song.artist}</td>
                      <td className="hide-sm">{song.album || <span className="muted">—</span>}</td>
                      <td className="hide-sm">{duration || <span className="muted">—</span>}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="text-btn"
                            disabled={player.pending}
                            onPointerDown={() => player.warm(song, 'audio')}
                            onClick={(event) => {
                              event.stopPropagation()
                              player.play(song, 'audio')
                            }}
                          >
                            播放歌曲
                          </button>
                          <button
                            type="button"
                            className="text-btn"
                            disabled={player.pending}
                            onPointerDown={() => player.warm(song, 'mv')}
                            onClick={(event) => {
                              event.stopPropagation()
                              player.play(song, 'mv')
                            }}
                          >
                            播放MV
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
            <nav className="pager" aria-label="搜索分页">
              {page <= 1 ? (
                <span className="is-disabled">上一页</span>
              ) : (
                <a href={searchHash(q, page - 1)}>上一页</a>
              )}
              {pages.map((n, index) => {
                const prev = pages[index - 1]
                const gap = prev && n - prev > 1
                return (
                  <span key={n} className="pager-slot">
                    {gap ? <span className="pager-gap">…</span> : null}
                    <a href={searchHash(q, n)} aria-current={n === page ? 'page' : undefined}>
                      {n}
                    </a>
                  </span>
                )
              })}
              {page >= totalPages ? (
                <span className="is-disabled">下一页</span>
              ) : (
                <a href={searchHash(q, page + 1)}>下一页</a>
              )}
            </nav>
          ) : null}
        </>
      )}
    </>
  )
}
