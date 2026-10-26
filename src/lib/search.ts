import { plainText } from './text'
import { endpoint, jsonp, useProxy, DIRECT_SUGGEST } from './source'

export type MusicItem = {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  image?: string
  images?: string[]
  hasMv: boolean
  mvId?: string
  mvFormats?: string[]
  mvPic?: string
}

export type SearchPageResult = {
  list: MusicItem[]
  total: number
  pn: number
  rn: number
}

function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key] as T
  }
  return undefined
}

function clean(value: unknown) {
  return plainText(value)
}

function parseDuration(value: unknown) {
  if (typeof value === 'string' && value.includes(':')) {
    const [min, sec] = value.split(':').map(Number)
    if (Number.isFinite(min) && Number.isFinite(sec)) return min * 60 + sec
  }
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 0
  return n > 10000 ? Math.round(n / 1000) : n
}

function mvPicture(raw: Record<string, unknown>) {
  const direct = String(pick(raw, 'hts_MVPIC') ?? '')
  if (direct) return direct
  const path = String(pick(raw, 'MVPIC') ?? '').replace(/^\/+/, '')
  return path ? `https://img4.kuwo.cn/wmvpic/${path}` : ''
}

function songMvId(raw: Record<string, unknown>) {
  const matched = /^MV_(\d+)$/.exec(String(pick(raw, 'MKVRID') ?? ''))
  return matched?.[1] && Number(matched[1]) > 0 ? matched[1] : ''
}

function songMvFormats(raw: Record<string, unknown>) {
  const list = String(pick(raw, 'FORMATS') ?? '')
    .split('|')
    .map((item) => item.trim().toUpperCase())
    .filter((item) => item.includes('MP4') || item.includes('MV'))
  return list.length ? list : undefined
}

function songHasMv(raw: Record<string, unknown>) {
  if (String(pick(raw, 'MVFLAG') ?? '') === '1') return true
  return Boolean(songMvId(raw))
}

function mapSearchItem(raw: Record<string, unknown>): MusicItem | null {
  const id = String(pick(raw, 'DC_TARGETID', 'musicId', 'MUSICRID') ?? '').replace(/^MUSIC_/, '')
  if (!id) return null
  const title = clean(pick(raw, 'SONGNAME', 'songName', 'NAME')) || '未知歌曲'
  const artist = clean(pick(raw, 'ARTIST', 'artist', 'ARTISTNAME')) || '未知歌手'
  const album = clean(pick(raw, 'ALBUM', 'album'))
  const image = String(pick(raw, 'web_albumpic_short', 'albumPic', 'pic') ?? '')
  const mvPic = mvPicture(raw)
  const mvId = songMvId(raw)
  const mvFormats = songMvFormats(raw)
  const images = collectImages(image, String(pick(raw, 'web_artistpic_short') ?? ''), mvPic)
  return {
    id,
    title,
    artist,
    album,
    duration: parseDuration(pick(raw, 'DURATION', 'duration')),
    image,
    images,
    hasMv: songHasMv(raw),
    mvId: mvId || undefined,
    mvFormats,
    mvPic: mvPic || undefined,
  }
}

export function coverUrl(path?: string, kind: 'album' | 'artist' = 'album') {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path)
      if (url.hostname.includes('kuwo.cn')) {
        if (url.hostname.startsWith('img4.') || url.pathname.includes('/wmvpic/')) {
          url.protocol = 'https:'
          return url.toString()
        }
        if (!useProxy) {
          url.protocol = 'https:'
          return url.toString()
        }
        return endpoint('img', `${url.pathname}${url.search}`)
      }
    } catch {
      return path
    }
    return path
  }
  const cleaned = path.replace(/^\/+/, '')
  if (cleaned.startsWith('star/')) return endpoint('img', `/${cleaned}`)
  const root = kind === 'artist' ? 'star/starheads' : 'star/albumcover'
  return endpoint('img', `/${root}/${cleaned}`)
}

function collectImages(album: string, artist: string, mv: string) {
  return [...new Set([coverUrl(album), coverUrl(artist, 'artist'), coverUrl(mv)].filter(Boolean))]
}

export const POSTER_SIZE = { sd: 300, hd: 500, fhd: 700 } as const

export function withCoverSize(url: string, size: number) {
  if (!url) return ''
  return url.replace(/\/(120|300|500|700|800)(?=\/)/g, `/${size}`)
}

export function songPosters(song?: Pick<MusicItem, 'image' | 'images'> | null, size: number = POSTER_SIZE.fhd) {
  const ready = (song?.images ?? []).filter(Boolean)
  const list = ready.length ? ready : [coverUrl(song?.image)].filter(Boolean)
  return [...new Set(list.map((url) => withCoverSize(url, size)))]
}

export function formatDuration(sec: number) {
  if (!sec || sec <= 0) return ''
  const min = Math.floor(sec / 60)
  const rest = Math.floor(sec % 60)
  return `${min}:${String(rest).padStart(2, '0')}`
}

const searchCache = new Map<string, SearchPageResult>()
const noMvIds = new Set<string>()
const noMvListeners = new Set<() => void>()

export function isSongWithoutMv(id: string) {
  return noMvIds.has(id)
}

export function rememberNoMv(id: string) {
  if (!id || noMvIds.has(id)) return
  noMvIds.add(id)
  for (const page of searchCache.values()) {
    page.list = page.list.map((item) => (item.id === id ? { ...item, hasMv: false } : item))
  }
  noMvListeners.forEach((listener) => listener())
}

export function subscribeNoMv(listener: () => void) {
  noMvListeners.add(listener)
  return () => {
    noMvListeners.delete(listener)
  }
}

function withoutKnownMv(item: MusicItem): MusicItem {
  return noMvIds.has(item.id) ? { ...item, hasMv: false } : item
}

export function peekSearch(keyword: string, pn = 0, rn = 20) {
  return searchCache.get(`${keyword}\n${pn}\n${rn}`)
}

export async function searchMusic(keyword: string, pn = 0, rn = 20): Promise<SearchPageResult> {
  const key = `${keyword}\n${pn}\n${rn}`
  const cached = searchCache.get(key)
  if (cached) return cached
  const qs = new URLSearchParams({
    all: keyword,
    ft: 'music',
    client: 'kt',
    cluster: '0',
    pn: String(pn),
    rn: String(rn),
    rformat: 'json',
    encoding: 'utf8',
    vipver: '1',
  })
  const path = `/r.s?${qs}`
  let data: Record<string, unknown>
  if (useProxy) {
    const res = await fetch(endpoint('search', path))
    if (!res.ok) throw new Error('搜索失败')
    const text = await res.text()
    try {
      data = JSON.parse(text) as Record<string, unknown>
    } catch {
      data = JSON.parse(text.replace(/'/g, '"')) as Record<string, unknown>
    }
  } else {
    data = await jsonp<Record<string, unknown>>(endpoint('search', path))
  }
  const list = (pick(data, 'abslist', 'list') as Record<string, unknown>[] | undefined) ?? []
  const total = Number(pick(data, 'TOTAL', 'total', 'HIT', 'hit') ?? list.length) || 0
  const result = {
    list: list
      .map(mapSearchItem)
      .filter((item): item is MusicItem => !!item)
      .map(withoutKnownMv),
    total,
    pn,
    rn,
  }
  searchCache.set(key, result)
  return result
}

const playableCache = new Map<string, MusicItem>()

function compact(value: string) {
  return value.replace(/\s+/g, '').toLowerCase()
}

export async function findPlayable(title: string, artist: string): Promise<MusicItem> {
  const key = `${title}\n${artist}`
  const cached = playableCache.get(key)
  if (cached) return cached
  const result = await searchMusic(`${title} ${artist}`, 0, 10)
  const wantTitle = compact(title)
  const wantArtist = compact(artist)
  const matched =
    result.list.find((item) => {
      const name = compact(item.title)
      const singer = compact(item.artist)
      const titleOk = name === wantTitle || name.startsWith(wantTitle) || name.includes(wantTitle)
      const artistOk = singer.includes(wantArtist) || wantArtist.includes(singer)
      return titleOk && artistOk
    }) ?? result.list[0]
  if (!matched) throw new Error('没有找到可播放的歌曲')
  playableCache.set(key, matched)
  return matched
}

export async function searchKey(keyword: string): Promise<string[]> {
  const q = keyword.trim()
  if (!q) return []
  let raw: unknown
  if (!useProxy) {
    const qs = new URLSearchParams({ c: 'web', w: q, encoding: 'utf8' })
    const res = await fetch(`${DIRECT_SUGGEST}?${qs}`)
    if (!res.ok) return []
    raw = await res.text()
  } else {
    const res = await fetch(endpoint('openapi', `/openapi/v1/www/search/searchKey?key=${encodeURIComponent(q)}`))
    if (!res.ok) return []
    const data = (await res.json()) as { data?: unknown }
    raw = data.data
  }
  if (!raw) return []

  const extract = (text: string) => {
    const matched = text.match(/(?:^|\r?\n)RELWORD=([^\r\n]+)/i)
    if (matched?.[1]) return plainText(matched[1])
    const first = plainText(text.split(/\t|\r?\n/)[0] ?? '')
    if (/^[A-Z_]+=/.test(first)) return ''
    return first
  }

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return extract(item)
        if (item && typeof item === 'object') {
          const row = item as Record<string, unknown>
          return plainText(row.RELWORD ?? row.keyword ?? row.name)
        }
        return ''
      })
      .filter(Boolean)
      .slice(0, 8)
  }
  if (typeof raw === 'string') {
    return raw
      .split(/\n(?=RELWORD=)/i)
      .map((part) => extract(part))
      .filter(Boolean)
      .slice(0, 8)
  }
  return []
}
