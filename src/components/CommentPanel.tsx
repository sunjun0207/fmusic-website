import { useEffect, useRef, useState } from 'react'
import { fetchComments, type SongComment } from '../lib/comment'

function Avatar({ item }: { item: SongComment }) {
  const [broken, setBroken] = useState(false)
  if (!item.avatar || broken) return <span>{item.user.slice(0, 1)}</span>
  return <img src={item.avatar} alt="" onError={() => setBroken(true)} />
}

export function CommentPanel({ songId }: { songId: string }) {
  const [list, setList] = useState<SongComment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading')
  const [more, setMore] = useState(false)
  const songRef = useRef(songId)
  songRef.current = songId

  useEffect(() => {
    let cancel = false
    setList([])
    setTotal(0)
    setPage(1)
    setMore(false)
    setStatus('loading')
    fetchComments(songId, 1)
      .then((result) => {
        if (cancel) return
        setList(result.list)
        setTotal(result.total)
        setStatus(result.list.length ? 'ready' : 'empty')
      })
      .catch(() => {
        if (!cancel) setStatus('error')
      })
    return () => {
      cancel = true
    }
  }, [songId])

  const loadMore = () => {
    const owner = songId
    const next = page + 1
    setMore(true)
    fetchComments(songId, next)
      .then((result) => {
        if (songRef.current !== owner) return
        setList((current) => {
          const seen = new Set(current.map((item) => item.id))
          return [...current, ...result.list.filter((item) => !seen.has(item.id))]
        })
        setTotal(result.total)
        setPage(next)
      })
      .catch(() => undefined)
      .finally(() => {
        if (songRef.current === owner) setMore(false)
      })
  }

  return (
    <aside className="comment-panel" aria-label="歌曲评论">
      <header>
        <strong>评论</strong>
        {total > 0 ? <span>{total}</span> : null}
      </header>
      {status === 'loading' ? <p className="comment-state">评论加载中…</p> : null}
      {status === 'empty' ? <p className="comment-state">还没有评论</p> : null}
      {status === 'error' ? <p className="comment-state">评论暂时加载不了</p> : null}
      {status === 'ready' ? (
        <ul className="comment-list">
          {list.map((item) => (
            <li key={item.id} className="comment-item">
              <Avatar item={item} />
              <div>
                <strong>{item.user}</strong>
                {item.time ? <time>{item.time}</time> : null}
                <p>{item.text}</p>
                {item.likes > 0 ? <em>{item.likes} 赞</em> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {status === 'ready' && list.length < total ? (
        <button type="button" className="comment-more" disabled={more} onClick={loadMore}>
          {more ? '加载中…' : '更多评论'}
        </button>
      ) : null}
    </aside>
  )
}
