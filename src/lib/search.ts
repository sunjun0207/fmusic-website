export type MusicItem = {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  image?: string
  hasMv: boolean
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
  return String(value ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
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

function songHasMv(raw: Record<string, unknown>) {
  if (String(pick(raw, 'MVFLAG') ?? '') === '1') return true
  return String(pick(raw, 'MKVRID') ?? '').startsWith('MV_')
}

function mapSearchItem(raw: Record<string, unknown>): MusicItem | null {
  const id = String(pick(raw, 'DC_TARGETID', 'musicId', 'MUSICRID') ?? '').replace(/^MUSIC_/, '')
  if (!id) return null
  const title = clean(pick(raw, 'SONGNAME', 'songName', 'NAME')) || '未知歌曲'
  const artist = clean(pick(raw, 'ARTIST', 'artist', 'ARTISTNAME')) || '未知歌手'
  const album = clean(pick(raw, 'ALBUM', 'album'))
  const image = String(pick(raw, 'web_albumpic_short', 'albumPic', 'pic') ?? '')
  const mvPic = mvPicture(raw)
  return {
    id,
    title,
    artist,
    album,
    duration: parseDuration(pick(raw, 'DURATION', 'duration')),
    image,
    hasMv: songHasMv(raw),
    mvPic: mvPic || undefined,
  }
}

export function coverUrl(path?: string) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path)
      if (url.hostname.includes('kuwo.cn')) {
        if (url.hostname.startsWith('img4.') || url.pathname.includes('/wmvpic/')) {
          url.protocol = 'https:'
          return url.toString()
        }
        return `/proxy/kw-img${url.pathname}${url.search}`
      }
    } catch {
      return path
    }
    return path
  }
  const cleaned = path.replace(/^\/+/, '')
  if (cleaned.startsWith('star/albumcover/')) return `/proxy/kw-img/${cleaned}`
  return `/proxy/kw-img/star/albumcover/${cleaned}`
}

export function formatDuration(sec: number) {
  if (!sec || sec <= 0) return ''
  const min = Math.floor(sec / 60)
  const rest = Math.floor(sec % 60)
  return `${min}:${String(rest).padStart(2, '0')}`
}

const searchCache = new Map<string, SearchPageResult>()

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
  const res = await fetch(`/proxy/kw-search/r.s?${qs}`)
  if (!res.ok) throw new Error('搜索失败')
  const text = await res.text()
  let data: Record<string, unknown>
  try {
    data = JSON.parse(text) as Record<string, unknown>
  } catch {
    data = JSON.parse(text.replace(/'/g, '"')) as Record<string, unknown>
  }
  const list = (pick(data, 'abslist', 'list') as Record<string, unknown>[] | undefined) ?? []
  const total = Number(pick(data, 'TOTAL', 'total', 'HIT', 'hit') ?? list.length) || 0
  const result = {
    list: list.map(mapSearchItem).filter((item): item is MusicItem => !!item),
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
  const res = await fetch(`/proxy/kw-openapi/openapi/v1/www/search/searchKey?key=${encodeURIComponent(q)}`)
  if (!res.ok) return []
  const data = (await res.json()) as { data?: unknown }
  const raw = data.data
  if (!raw) return []

  const extract = (text: string) => {
    const matched = text.match(/(?:^|\r?\n)RELWORD=([^\r\n]+)/i)
    if (matched?.[1]) return matched[1].trim()
    const first = text.split(/\t|\r?\n/)[0]?.trim() ?? ''
    if (/^[A-Z_]+=/.test(first)) return ''
    return first
  }

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return extract(item)
        if (item && typeof item === 'object') {
          const row = item as Record<string, unknown>
          return String(row.RELWORD ?? row.keyword ?? row.name ?? '').trim()
        }
        return ''
      })
      .filter(Boolean)
      .slice(0, 8)
  }
  if (typeof raw === 'string') {
    const word = extract(raw)
    return word ? [word] : []
  }
  return []
}
