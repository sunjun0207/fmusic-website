import type { PlayMode } from './playback'
import type { MusicItem } from './search'

const KEYS = {
  recentPlays: 'fmusic_website_recent_plays',
  favorites: 'fmusic_website_favorites',
  playMode: 'fmusic_website_play_mode',
} as const

const PLAY_MODES: PlayMode[] = ['list', 'single', 'shuffle']

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getRecentPlays(): MusicItem[] {
  return readJson<MusicItem[]>(KEYS.recentPlays, [])
}

export function addRecentPlay(item: MusicItem) {
  if (!item.id) return
  const list = getRecentPlays().filter((song) => song.id !== item.id)
  list.unshift(item)
  writeJson(KEYS.recentPlays, list.slice(0, 40))
}

export function getFavorites(): MusicItem[] {
  return readJson<MusicItem[]>(KEYS.favorites, [])
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((song) => song.id === id)
}

export function toggleFavorite(item: MusicItem): boolean {
  const list = getFavorites()
  const exists = list.some((song) => song.id === item.id)
  if (exists) {
    writeJson(
      KEYS.favorites,
      list.filter((song) => song.id !== item.id),
    )
    return false
  }
  writeJson(KEYS.favorites, [item, ...list].slice(0, 200))
  return true
}

export function removeFavorite(id: string) {
  writeJson(
    KEYS.favorites,
    getFavorites().filter((song) => song.id !== id),
  )
}

export function clearFavorites() {
  writeJson(KEYS.favorites, [])
}

export function getPlayMode(): PlayMode {
  const raw = localStorage.getItem(KEYS.playMode)
  return PLAY_MODES.includes(raw as PlayMode) ? (raw as PlayMode) : 'list'
}

export function savePlayMode(mode: PlayMode) {
  localStorage.setItem(KEYS.playMode, mode)
}
