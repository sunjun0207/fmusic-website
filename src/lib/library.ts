import type { PlayMode } from './playback'
import type { MusicItem } from './search'
import { plainText } from './text'

const KEYS = {
  recentPlays: 'fmusic_website_recent_plays',
  favorites: 'fmusic_website_favorites',
  playMode: 'fmusic_website_play_mode',
  posterQuality: 'fmusic_website_poster_quality',
  mvQuality: 'fmusic_website_mv_quality',
  mvVolume: 'fmusic_website_mv_volume',
  mvBrightness: 'fmusic_website_mv_brightness',
  danmaku: 'fmusic_website_danmaku',
} as const

export type PictureQuality = 'sd' | 'hd' | 'fhd'

const PICTURE_QUALITIES: PictureQuality[] = ['sd', 'hd', 'fhd']

function readQuality(key: string): PictureQuality {
  const raw = localStorage.getItem(key)
  return PICTURE_QUALITIES.includes(raw as PictureQuality) ? (raw as PictureQuality) : 'fhd'
}

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

function presentSong(item: MusicItem): MusicItem {
  return {
    ...item,
    title: plainText(item.title),
    artist: plainText(item.artist),
    album: plainText(item.album),
  }
}

export function getRecentPlays(): MusicItem[] {
  return readJson<MusicItem[]>(KEYS.recentPlays, []).map(presentSong)
}

export function addRecentPlay(item: MusicItem) {
  if (!item.id) return
  const list = getRecentPlays().filter((song) => song.id !== item.id)
  list.unshift(item)
  writeJson(KEYS.recentPlays, list.slice(0, 40))
}

export function getFavorites(): MusicItem[] {
  return readJson<MusicItem[]>(KEYS.favorites, []).map(presentSong)
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

export function getPosterQuality() {
  return readQuality(KEYS.posterQuality)
}

export function savePosterQuality(quality: PictureQuality) {
  localStorage.setItem(KEYS.posterQuality, quality)
}

export function getMvQuality() {
  return readQuality(KEYS.mvQuality)
}

export function saveMvQuality(quality: PictureQuality) {
  localStorage.setItem(KEYS.mvQuality, quality)
}

function readLevel(key: string, fallback: number, min: number, max: number) {
  const value = Number(localStorage.getItem(key))
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function getMvVolume() {
  return readLevel(KEYS.mvVolume, 100, 0, 100)
}

export function saveMvVolume(value: number) {
  localStorage.setItem(KEYS.mvVolume, String(value))
}

export function getMvBrightness() {
  return readLevel(KEYS.mvBrightness, 100, 40, 160)
}

export function saveMvBrightness(value: number) {
  localStorage.setItem(KEYS.mvBrightness, String(value))
}

export function getDanmakuEnabled() {
  return localStorage.getItem(KEYS.danmaku) !== '0'
}

export function saveDanmakuEnabled(on: boolean) {
  localStorage.setItem(KEYS.danmaku, on ? '1' : '0')
}
