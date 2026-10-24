import { useEffect, useMemo, useRef, useState } from 'react'
import { appendComments, fetchComments, threadComments, type SongComment } from '../lib/comment'

function LikeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" />
    </svg>
  )
}

function ReplyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 7h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H11l-3.5 3v-3H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
    </svg>
  )
}

function Marks({ medal, medalLevel, rank }: { medal: string; medalLevel: number; rank: number }) {
  if (!medal && rank <= 0) return null
  return (
    <>
      {medal ? <span className="comment-badge">{medalLevel > 0 ? `${medal} ${medalLevel}` : medal}</span> : null}
      {rank > 0 ? <span className="comment-badge">等级 {rank}</span> : null}
    </>
  )
}

function Avatar({ item }: { item: SongComment }) {
  const [broken, setBroken] = useState(false)
  if (!item.avatar || broken) return <span>{item.user.slice(0, 1)}</span>
  return <img src={item.avatar} alt="" onError={() => setBroken(true)} />
}

function CommentNode({ item }: { item: SongComment }) {
  return (
    <li className="comment-item">
      <Avatar item={item} />
      <div>
        <div className="comment-user">
          <strong>{item.user}</strong>
          <Marks medal={item.medal} medalLevel={item.medalLevel} rank={item.rank} />
        </div>
        {item.time ? <time>{item.time}</time> : null}
        <p>{item.text}</p>
        <div className="comment-actions">
          <span className="comment-stat" aria-label={`${item.likes} 赞`}>
            <LikeIcon />
            <em>{item.likes}</em>
          </span>
          <span className="comment-stat" aria-label={`${item.replies.length} 条评论`}>
            <ReplyIcon />
            <em>{item.replies.length}</em>
          </span>
        </div>
        {item.replies.length ? (
          <ul className="comment-children">
            {item.replies.map((reply) => (
              <CommentNode key={reply.id} item={reply} />
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  )
}

export function CommentPanel({ songId }: { songId: string }) {
  const [flat, setFlat] = useState<SongComment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [seen, setSeen] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading')
  const [more, setMore] = useState(false)
  const songRef = useRef(songId)
  songRef.current = songId
  const list = useMemo(() => threadComments(flat), [flat])

  useEffect(() => {
    let cancel = false
    setFlat([])
    setTotal(0)
    setPage(1)
    setSeen(0)
    setMore(false)
    setStatus('loading')
    fetchComments(songId, 1)
      .then((result) => {
        if (cancel) return
        setFlat(result.list)
        setTotal(result.total)
        setSeen(result.size)
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
        setFlat((current) => appendComments(current, result.list))
        setTotal(result.total)
        setSeen((value) => value + result.size)
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
            <CommentNode key={item.id} item={item} />
          ))}
        </ul>
      ) : null}
      {status === 'ready' && seen < total ? (
        <button type="button" className="comment-more" disabled={more} onClick={loadMore}>
          {more ? '加载中…' : '更多评论'}
        </button>
      ) : null}
    </aside>
  )
}
