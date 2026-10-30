import { useEffect, useRef, useState } from 'react'
import { coverUrl, type MusicItem } from '../lib/search'

type Tab = 'queue' | 'recent'

type Props = {
  open: boolean
  queue: MusicItem[]
  recent: MusicItem[]
  currentId: string
  onClose: () => void
  onPickQueue: (song: MusicItem) => void
  onPickRecent: (song: MusicItem) => void
}

export function PlayQueue({ open, queue, recent, currentId, onClose, onPickQueue, onPickRecent }: Props) {
  const [tab, setTab] = useState<Tab>('queue')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setTab('queue')
  }, [open])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => {
      const list = listRef.current
      const node = list?.querySelector<HTMLElement>('.queue-item.is-on')
      if (!list || !node) return
      const top = node.getBoundingClientRect().top - list.getBoundingClientRect().top
      list.scrollTop += top - list.clientHeight / 2 + node.clientHeight / 2
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open, tab, currentId, queue, recent])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const items = tab === 'queue' ? queue : recent
  const empty = tab === 'queue' ? '这里还没有音乐，去收藏一些喜欢的歌吧' : '还没有播放记录，听过的歌会留在这里'

  return (
    <div className="queue-overlay" onClick={onClose}>
      <div className="queue-sheet" role="dialog" aria-label="播放列表" onClick={(event) => event.stopPropagation()}>
        <div className="queue-head">
          <h3>播放列表</h3>
          <button type="button" className="text-btn" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="queue-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'queue'} className={tab === 'queue' ? 'on' : ''} onClick={() => setTab('queue')}>
            当前播放
            <span>{queue.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={tab === 'recent'} className={tab === 'recent' ? 'on' : ''} onClick={() => setTab('recent')}>
            最近播放
            <span>{recent.length}</span>
          </button>
        </div>
        <div className="queue-list" ref={listRef}>
          {items.length === 0 ? (
            <p className="meta">{empty}</p>
          ) : (
            items.map((song) => {
              const cover = coverUrl(song.image)
              const active = song.id === currentId
              return (
                <button
                  key={`${tab}-${song.id}`}
                  type="button"
                  className={active ? 'queue-item is-on' : 'queue-item'}
                  onClick={() => (tab === 'queue' ? onPickQueue(song) : onPickRecent(song))}
                >
                  {cover ? <img src={cover} alt="" /> : <span className="song-cover" />}
                  <span>
                    <strong>{song.title}</strong>
                    <em>{song.artist}</em>
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
