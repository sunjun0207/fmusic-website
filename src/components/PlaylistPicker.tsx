import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react'
import { addToMyPlaylist, createMyPlaylist, getMyPlaylists } from '../lib/library'
import { thumbUrl, type MusicItem } from '../lib/search'
import { toast } from '../lib/toast'
import { useLibraryVersion } from '../lib/useLibrary'
import { Cover } from './Cover'
import { Icon } from './Icon'

let current: MusicItem | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function openPlaylistPicker(song: MusicItem) {
  current = song
  emit()
}

function closePicker() {
  current = null
  emit()
}

export function PlaylistPicker() {
  const song = useSyncExternalStore(subscribe, () => current)
  const version = useLibraryVersion()
  const lists = useMemo(() => {
    void version
    return song ? getMyPlaylists() : []
  }, [song, version])
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    if (!song) return
    setName('')
    setCreating(getMyPlaylists().length === 0)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePicker()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [song])

  if (!song) return null

  const add = (id: string, listName: string) => {
    toast(addToMyPlaylist(id, song) ? `已加入「${listName}」` : `「${listName}」里已经有这首歌了`)
    closePicker()
  }

  const create = (event: FormEvent) => {
    event.preventDefault()
    const list = createMyPlaylist(name.trim() || '我的专属歌单')
    addToMyPlaylist(list.id, song)
    toast(`已创建「${list.name}」，这首歌是第一首`)
    closePicker()
  }

  return (
    <div className="sheet-layer" onClick={closePicker}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="加入歌单" onClick={(event) => event.stopPropagation()}>
        <header className="sheet-head">
          <div>
            <strong>加入歌单</strong>
            <span>
              {song.title} · {song.artist}
            </span>
          </div>
          <button type="button" className="op-btn" aria-label="关闭" onClick={closePicker}>
            <Icon name="close" />
          </button>
        </header>
        {creating ? (
          <form className="sheet-create" onSubmit={create}>
            <input
              autoFocus
              value={name}
              maxLength={40}
              placeholder="给歌单起个名字，比如「下雨天听的歌」"
              aria-label="歌单名称"
              onChange={(event) => setName(event.target.value)}
            />
            <button type="submit" className="btn">
              创建并加入
            </button>
          </form>
        ) : (
          <button type="button" className="sheet-new" onClick={() => setCreating(true)}>
            <span className="sheet-new-icon">
              <Icon name="plus" />
            </span>
            创建我的专属歌单
          </button>
        )}
        {lists.length ? (
          <ul className="sheet-list">
            {lists.map((list) => (
              <li key={list.id}>
                <button type="button" onClick={() => add(list.id, list.name)}>
                  <Cover className="sheet-cover" src={thumbUrl(list.songs[0]?.image)} />
                  <span>
                    <strong>{list.name}</strong>
                    <small>{list.songs.length} 首</small>
                  </span>
                  {list.songs.some((item) => item.id === song.id) ? <Icon name="check" className="sheet-check" /> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
