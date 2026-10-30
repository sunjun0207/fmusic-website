import type { PlayMode } from './playback'
import type { MusicItem } from './search'
import { plainText } from './text'

const KEYS = {
  recentPlays: 'fmusic_website_recent_plays',
  favorites: 'fmusic_website_favorites',
  playMode: 'fmusic_website_play_mode',
  posterQuality: 'fmusic_website_poster_quality',
  mvQuality: 'fmusic_website_mv_quality',
  songQuality: 'fmusic_website_song_quality',
  songVolume: 'fmusic_website_song_volume',
  songBrightness: 'fmusic_website_song_brightness',
  mvVolume: 'fmusic_website_mv_volume',
  mvBrightness: 'fmusic_website_mv_brightness',
  danmaku: 'fmusic_website_danmaku',
  searchHistory: 'fmusic_website_search_history',
  myPlaylists: 'fmusic_website_my_playlists',
  playStats: 'fmusic_website_play_stats',
  nickname: 'fmusic_website_nickname',
} as const

const listeners = new Set<() => void>()

/** 收藏、最近播放、自建歌单、昵称变了都会通知，页面据此刷新。 */
export function onLibraryChange(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function changed() {
  listeners.forEach((listener) => listener())
}

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

export function getSearchHistory() {
  return readJson<string[]>(KEYS.searchHistory, [])
    .map((item) => plainText(item).trim())
    .filter(Boolean)
}

export function addSearchHistory(keyword: string) {
  const text = plainText(keyword).trim()
  if (!text) return
  const list = getSearchHistory().filter((item) => item !== text)
  list.unshift(text)
  writeJson(KEYS.searchHistory, list.slice(0, 12))
}

export function removeSearchHistory(keyword: string) {
  const text = plainText(keyword).trim()
  writeJson(
    KEYS.searchHistory,
    getSearchHistory().filter((item) => item !== text),
  )
}

export function clearSearchHistory() {
  writeJson(KEYS.searchHistory, [])
}

export function getRecentPlays(): MusicItem[] {
  return readJson<MusicItem[]>(KEYS.recentPlays, []).map(presentSong)
}

export type PlayStats = { count: number; since: number }

export function getPlayStats(): PlayStats {
  const stats = readJson<Partial<PlayStats>>(KEYS.playStats, {})
  const since = Number(stats.since) || Date.now()
  if (!stats.since) writeJson(KEYS.playStats, { count: Number(stats.count) || 0, since })
  return { count: Number(stats.count) || 0, since }
}

export function addRecentPlay(item: MusicItem) {
  if (!item.id) return
  const list = getRecentPlays().filter((song) => song.id !== item.id)
  list.unshift(item)
  writeJson(KEYS.recentPlays, list.slice(0, 40))
  const stats = getPlayStats()
  writeJson(KEYS.playStats, { ...stats, count: stats.count + 1 })
  changed()
}

export function clearRecentPlays() {
  writeJson(KEYS.recentPlays, [])
  changed()
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
    changed()
    return false
  }
  writeJson(KEYS.favorites, [item, ...list].slice(0, 200))
  changed()
  return true
}

export function removeFavorite(id: string) {
  writeJson(
    KEYS.favorites,
    getFavorites().filter((song) => song.id !== id),
  )
  changed()
}

export function clearFavorites() {
  writeJson(KEYS.favorites, [])
  changed()
}

export type MyPlaylist = { id: string; name: string; songs: MusicItem[]; created: number }

export function getMyPlaylists(): MyPlaylist[] {
  return readJson<MyPlaylist[]>(KEYS.myPlaylists, [])
    .filter((item) => item && item.id && Array.isArray(item.songs))
    .map((item) => ({ ...item, name: plainText(item.name) || '我的专属歌单', songs: item.songs.map(presentSong) }))
}

function saveMyPlaylists(list: MyPlaylist[]) {
  writeJson(KEYS.myPlaylists, list)
  changed()
}

/** 新建歌单；传入歌曲时就是把整张歌单收进「我的音乐」。 */
export function createMyPlaylist(name: string, songs: MusicItem[] = []): MyPlaylist {
  const unique = new Map(songs.filter((song) => song.id).map((song) => [song.id, song]))
  const item: MyPlaylist = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: plainText(name).slice(0, 40) || '我的专属歌单',
    songs: [...unique.values()].slice(0, 500),
    created: Date.now(),
  }
  saveMyPlaylists([item, ...getMyPlaylists()])
  return item
}

export function deleteMyPlaylist(id: string) {
  saveMyPlaylists(getMyPlaylists().filter((item) => item.id !== id))
}

/** 已经在歌单里时返回 false，不重复添加。 */
export function addToMyPlaylist(id: string, song: MusicItem): boolean {
  const list = getMyPlaylists()
  const target = list.find((item) => item.id === id)
  if (!target || !song.id || target.songs.some((item) => item.id === song.id)) return false
  target.songs = [song, ...target.songs].slice(0, 500)
  saveMyPlaylists(list)
  return true
}

export function removeFromMyPlaylist(id: string, songId: string) {
  saveMyPlaylists(getMyPlaylists().map((item) => (item.id === id ? { ...item, songs: item.songs.filter((song) => song.id !== songId) } : item)))
}

export function getNickname() {
  return plainText(localStorage.getItem(KEYS.nickname) ?? '').slice(0, 20)
}

export function saveNickname(name: string) {
  localStorage.setItem(KEYS.nickname, plainText(name).slice(0, 20))
  changed()
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

export function getSongQuality(): PictureQuality {
  const raw = localStorage.getItem(KEYS.songQuality)
  return PICTURE_QUALITIES.includes(raw as PictureQuality) ? (raw as PictureQuality) : 'hd'
}

export function saveSongQuality(quality: PictureQuality) {
  localStorage.setItem(KEYS.songQuality, quality)
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

export function getSongVolume() {
  return readLevel(KEYS.songVolume, 100, 0, 100)
}

export function saveSongVolume(value: number) {
  localStorage.setItem(KEYS.songVolume, String(value))
}

export function getSongBrightness() {
  return readLevel(KEYS.songBrightness, 160, 40, 160)
}

export function saveSongBrightness(value: number) {
  localStorage.setItem(KEYS.songBrightness, String(value))
}

export function getMvVolume() {
  return readLevel(KEYS.mvVolume, 100, 0, 100)
}

export function saveMvVolume(value: number) {
  localStorage.setItem(KEYS.mvVolume, String(value))
}

export function getMvBrightness() {
  return readLevel(KEYS.mvBrightness, 160, 40, 160)
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
