import { useSyncExternalStore } from 'react'
import { stationForHour } from '../data/brand'
import { getDailyMix } from './daily'
import { fetchPlaylistDetail, fetchPlaylists, MissingError, NETWORK_TIP } from './kuwo'
import { shuffled } from './random'
import type { MusicItem } from './search'

/** 从某个分类的热门歌单里随机挑一张，打乱顺序当电台放。 */
export async function tagSongs(tagId: string, salt = Date.now()): Promise<MusicItem[]> {
  const page = await fetchPlaylists({ tag: tagId, page: 1, size: 12 })
  const full = page.list.filter((item) => item.count >= 15)
  const pool = full.length ? full : page.list
  const pick = pool[Math.abs(salt) % Math.max(pool.length, 1)]
  if (!pick) throw new MissingError('这个电台暂时没有歌')
  const detail = await fetchPlaylistDetail(pick.id, 1, 80)
  return shuffled(detail.songs, salt)
}

/** 私人电台：今天的每日推荐打底，再混进此刻时段电台的歌，每次收听顺序都不一样。 */
export async function privateSongs(): Promise<MusicItem[]> {
  const [mix, mood] = await Promise.allSettled([getDailyMix(), tagSongs(stationForHour().tagId)])
  const mine = mix.status === 'fulfilled' ? mix.value.songs : []
  const now = mood.status === 'fulfilled' ? mood.value.slice(0, 20) : []
  if (!mine.length && !now.length) throw new Error(NETWORK_TIP)
  const unique = new Map([...mine, ...now].map((song) => [song.id, song]))
  return shuffled([...unique.values()], Date.now())
}

type Tuned = { id: string; ids: string[] }

let tuned: Tuned = { id: '', ids: [] }
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 记住正在收听的电台和它的歌，切到别的页面也能标出「正在收听」。 */
export function setTuned(id: string, songs: MusicItem[]) {
  tuned = { id, ids: songs.map((song) => song.id) }
  listeners.forEach((listener) => listener())
}

export function useTuned() {
  return useSyncExternalStore(subscribe, () => tuned)
}
