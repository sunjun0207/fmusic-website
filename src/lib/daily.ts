import { fetchChartSongs, NETWORK_TIP } from './kuwo'
import { getFavorites, getRecentPlays } from './library'
import { dayKey, hashText, shuffled } from './random'
import { searchMusic, type MusicItem } from './search'

const KEY = 'fmusic_website_daily_mix'
const SIZE = 30

export type DailyMix = { date: string; basis: string[]; songs: MusicItem[] }

/** 收藏记 2 分、最近播放记 1 分，合唱按歌手拆开算。 */
export function favoriteArtists(limit = 3) {
  const score = new Map<string, number>()
  const add = (artist: string, weight: number) => {
    for (const name of artist.split(/[、&,，/]/).map((item) => item.trim())) {
      if (!name || name === '未知歌手') continue
      score.set(name, (score.get(name) ?? 0) + weight)
    }
  }
  getFavorites().forEach((song) => add(song.artist, 2))
  getRecentPlays().forEach((song) => add(song.artist, 1))
  return [...score.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([name]) => name)
}

function readSaved(): DailyMix | null {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null') as DailyMix | null
    return data && typeof data.date === 'string' && Array.isArray(data.songs) ? data : null
  } catch {
    return null
  }
}

export function peekDailyMix() {
  const saved = readSaved()
  return saved && saved.date === dayKey() && saved.songs.length > 0 ? saved : null
}

let building: Promise<DailyMix> | null = null

export function getDailyMix(): Promise<DailyMix> {
  const ready = peekDailyMix()
  if (ready) return Promise.resolve(ready)
  if (!building) {
    building = buildDailyMix().finally(() => {
      building = null
    })
  }
  return building
}

async function buildDailyMix(): Promise<DailyMix> {
  const date = dayKey()
  const basis = favoriteArtists(3)
  const seed = hashText(`${date}|${basis.join('|')}`)
  const heard = new Set(getRecentPlays().slice(0, 20).map((song) => song.id))
  const [charts, pools] = await Promise.all([
    Promise.allSettled(['16', '93', '17'].map((id) => fetchChartSongs(id, 1, 30))),
    Promise.all(
      basis.map((name) =>
        searchMusic(name, 0, 30)
          .then((page) => page.list.filter((song) => song.artist.includes(name)))
          .catch(() => [] as MusicItem[]),
      ),
    ),
  ])

  const picked: MusicItem[] = []
  const seen = new Set<string>()
  const take = (song: MusicItem) => {
    const sign = `${song.title}|${song.artist}`.replace(/\s+/g, '').toLowerCase()
    if (heard.has(song.id) || seen.has(song.id) || seen.has(sign)) return false
    seen.add(song.id)
    seen.add(sign)
    picked.push(song)
    return true
  }

  pools.forEach((pool, index) => {
    let count = 0
    for (const song of shuffled(pool, seed + index + 1)) {
      if (count >= 6) break
      if (take(song)) count += 1
    }
  })
  const hot = charts.flatMap((page) => (page.status === 'fulfilled' ? page.value.songs : []))
  for (const song of shuffled(hot, seed)) {
    if (picked.length >= SIZE) break
    take(song)
  }
  if (!picked.length) throw new Error(NETWORK_TIP)

  const mix: DailyMix = { date, basis, songs: shuffled(picked, seed ^ 0x5bd1e995) }
  localStorage.setItem(KEY, JSON.stringify(mix))
  return mix
}
