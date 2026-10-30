import { coverUrl, type MusicItem } from './search'
import { endpoint } from './source'
import { displayCopy, displayName, isHiddenPublicId, plainText } from './text'

type Json = Record<string, unknown>

export const NETWORK_TIP = '网络开了个小差，稍后再来听吧'

/** 对方明确告诉我们没有这份内容（歌单、歌手被删等），和网络失败分开提示。 */
export class MissingError extends Error {}

const TTL = 10 * 60 * 1000
const jobs = new Map<string, { at: number; job: Promise<unknown> }>()

function remember<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = jobs.get(key)
  if (hit && Date.now() - hit.at < TTL) return hit.job as Promise<T>
  const job = load().catch((error: unknown) => {
    jobs.delete(key)
    throw error
  })
  jobs.set(key, { at: Date.now(), job })
  return job
}

async function getJson(path: string): Promise<Json> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(endpoint('wapi', path), { signal: AbortSignal.timeout(12000) })
      if (!res.ok) continue
      const data = (await res.json()) as Json
      if (data.code !== undefined && Number(data.code) !== 200) continue
      return data
    } catch {
      /* 曲库偶尔连不上，再试一次 */
    }
  }
  throw new Error(NETWORK_TIP)
}

const str = (value: unknown) => (value === undefined || value === null ? '' : String(value))
const num = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}
const rows = (value: unknown): Json[] => (Array.isArray(value) ? (value as Json[]).filter((item) => item && typeof item === 'object') : [])
const body = (data: Json) => (data.data && typeof data.data === 'object' ? (data.data as Json) : {})

/** 简介类长文本：保留分段，其余按普通文本清洗。 */
function paragraphs(value: unknown) {
  return str(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .split(/\r?\n+/)
    .map((line) => displayCopy(plainText(line)))
    .filter(Boolean)
}

function isSong(item: MusicItem | null): item is MusicItem {
  return item !== null
}

export function toSong(raw: Json): MusicItem | null {
  const id = str(raw.rid || raw.musicrid).replace(/^MUSIC_/, '')
  if (!/^\d+$/.test(id) || isHiddenPublicId(id)) return null
  const pic = str(raw.pic || raw.albumpic || raw.pic120)
  const artistId = str(raw.artistid)
  const albumId = str(raw.albumid)
  const mv = raw.mvpayinfo && typeof raw.mvpayinfo === 'object' ? (raw.mvpayinfo as Json) : {}
  return {
    id,
    title: plainText(raw.name) || '未知歌曲',
    artist: plainText(raw.artist) || '未知歌手',
    album: plainText(raw.album),
    duration: num(raw.duration),
    image: pic,
    images: pic ? [coverUrl(pic)] : [],
    hasMv: num(raw.hasmv) === 1 || num(mv.vid) > 0,
    artistId: num(artistId) > 0 ? artistId : undefined,
    albumId: num(albumId) > 0 ? albumId : undefined,
    releaseDate: str(raw.releaseDate || raw.releasedate) || undefined,
  }
}

const songsOf = (value: unknown) => rows(value).map(toSong).filter(isSong)

/* ---------- 排行榜 ---------- */

export type ChartInfo = { id: string; name: string; intro: string; pic: string; pub: string }
export type ChartGroup = { name: string; charts: ChartInfo[] }
export type Trend = { dir: 'up' | 'down' | 'same' | 'new'; change: number }
export type ChartPage = { songs: MusicItem[]; trends: Record<string, Trend>; total: number; pub: string }

/** 相声、儿童故事这类不是歌的榜单不放进来。 */
const HIDDEN_CHARTS = new Set(['69', '291', '344'])

export function fetchChartGroups(): Promise<ChartGroup[]> {
  return remember('chart:menu', async () => {
    const data = await getJson('/api/www/bang/bang/bangMenu')
    return rows(data.data)
      .map((group) => ({
        name: plainText(group.name),
        charts: rows(group.list)
          .map((item) => ({
            id: str(item.sourceid),
            name: displayName(plainText(item.name)) || '排行榜',
            intro: displayCopy(plainText(item.intro)),
            pic: str(item.pic),
            pub: plainText(item.pub),
          }))
          .filter((chart) => chart.id && !HIDDEN_CHARTS.has(chart.id)),
      }))
      .filter((group) => group.charts.length > 0)
  })
}

function toTrend(raw: Json): Trend {
  const flag = str(raw.trend).charAt(0)
  const change = num(raw.rank_change)
  if (flag === 'n') return { dir: 'new', change: 0 }
  if (flag === 'u' && change > 0) return { dir: 'up', change }
  if (flag === 'd' && change > 0) return { dir: 'down', change }
  return { dir: 'same', change: 0 }
}

/** 榜单接口每次最多返回 30 首，rn 再大就直接报错。 */
const CHART_CHUNK = 30

function fetchChartChunk(id: string, page: number, size: number): Promise<ChartPage> {
  return remember(`chart:${id}:${page}:${size}`, async () => {
    const data = body(await getJson(`/api/www/bang/bang/musicList?bangId=${encodeURIComponent(id)}&pn=${page}&rn=${size}&httpsStatus=1`))
    const songs: MusicItem[] = []
    const trends: Record<string, Trend> = {}
    for (const raw of rows(data.musicList)) {
      const song = toSong(raw)
      if (!song || trends[song.id]) continue
      songs.push(song)
      trends[song.id] = toTrend(raw)
    }
    return { songs, trends, total: num(data.num) || songs.length, pub: plainText(data.pub) }
  })
}

export function fetchChartSongs(id: string, page = 1, size = 30): Promise<ChartPage> {
  if (size <= CHART_CHUNK) return fetchChartChunk(id, page, size)
  return remember(`chart:${id}:${page}:${size}`, async () => {
    const start = (page - 1) * size
    const first = Math.floor(start / CHART_CHUNK) + 1
    const count = Math.ceil((start + size) / CHART_CHUNK) - first + 1
    const [head, ...rest] = await Promise.allSettled(Array.from({ length: count }, (_, index) => fetchChartChunk(id, first + index, CHART_CHUNK)))
    if (head?.status !== 'fulfilled') throw head?.reason ?? new Error(NETWORK_TIP)
    const chunks = [head.value, ...rest.flatMap((item) => (item.status === 'fulfilled' ? [item.value] : []))]
    const merged: MusicItem[] = []
    const allTrends: Record<string, Trend> = {}
    for (const chunk of chunks) {
      for (const song of chunk.songs) {
        if (allTrends[song.id]) continue
        merged.push(song)
        allTrends[song.id] = chunk.trends[song.id] ?? { dir: 'same', change: 0 }
      }
    }
    const offset = start - (first - 1) * CHART_CHUNK
    const songs = merged.slice(offset, offset + size)
    const trends: Record<string, Trend> = {}
    for (const song of songs) trends[song.id] = allTrends[song.id] ?? { dir: 'same', change: 0 }
    return { songs, trends, total: head.value.total, pub: head.value.pub }
  })
}

/* ---------- 歌单 ---------- */

export type PlaylistCard = { id: string; name: string; cover: string; plays: number; count: number; creator: string; intro: string }
export type PlaylistDetail = PlaylistCard & { creatorPic: string; tags: string[]; songs: MusicItem[] }
export type PlaylistPage = { list: PlaylistCard[]; total: number }
export type TagItem = { id: string; name: string }
export type TagGroup = { name: string; tags: TagItem[] }

function toPlaylist(raw: Json): PlaylistCard | null {
  const id = str(raw.id)
  if (!/^\d+$/.test(id) || isHiddenPublicId(id)) return null
  return {
    id,
    name: displayName(plainText(raw.name)) || '未命名歌单',
    cover: str(raw.img500 || raw.img || raw.img700 || raw.img300),
    plays: num(raw.listencnt),
    count: num(raw.total),
    creator: plainText(raw.uname || raw.userName),
    intro: displayCopy(plainText(raw.info || raw.desc)),
  }
}

const playlistsOf = (value: unknown) => rows(value).map(toPlaylist).filter((item): item is PlaylistCard => item !== null)

/** 官方每日推荐的歌单，带一句推荐语。 */
export function fetchRecommendPlaylists(size = 10): Promise<PlaylistCard[]> {
  return remember(`pl:rcm:${size}`, async () => {
    const data = body(await getJson(`/api/www/rcm/index/playlist?id=rcm&pn=1&rn=${size}&httpsStatus=1`))
    return playlistsOf(data.list)
  })
}

export function fetchPlaylists(options: { tag?: string; order?: 'hot' | 'new'; page?: number; size?: number }): Promise<PlaylistPage> {
  const { tag = '', order = 'hot', page = 1, size = 30 } = options
  const path = tag
    ? `/api/www/classify/playlist/getTagPlayList?pn=${page}&rn=${size}&id=${encodeURIComponent(tag)}&httpsStatus=1`
    : `/api/www/classify/playlist/getRcmPlayList?pn=${page}&rn=${size}&order=${order}&httpsStatus=1`
  return remember(`pl:list:${tag}:${order}:${page}:${size}`, async () => {
    const data = body(await getJson(path))
    return { list: playlistsOf(data.data), total: num(data.total) }
  })
}

/** 专区、有声内容和不像歌的分类不展示。 */
const SKIP_TAG_GROUPS = new Set(['专区', '有声系列'])
const HIDDEN_TAGS = new Set(['171', '216', '220', '263', '334', '241'])

export function fetchTagGroups(): Promise<TagGroup[]> {
  return remember('pl:tags', async () => {
    const data = await getJson(
      '/api/pc/classify/playlist/getTagList?cmd=rcm_keyword_playlist&user=0&prod=kwplayer_pc_9.0.5.0&vipver=9.0.5.0&source=kwplayer_pc_9.0.5.0&loginUid=0&loginSid=0&appUid=76039576',
    )
    return rows(data.data)
      .map((group) => ({
        name: plainText(group.name),
        tags: rows(group.data)
          .filter((tag) => str(tag.digest) === '10000' && !HIDDEN_TAGS.has(str(tag.id)))
          .map((tag) => ({ id: str(tag.id), name: plainText(tag.name) }))
          .filter((tag) => tag.id && tag.name),
      }))
      .filter((group) => group.tags.length > 0 && !SKIP_TAG_GROUPS.has(group.name))
  })
}

export function fetchPlaylistDetail(id: string, page = 1, size = 100): Promise<PlaylistDetail> {
  return remember(`pl:detail:${id}:${page}:${size}`, async () => {
    const data = body(await getJson(`/api/www/playlist/playListInfo?pid=${encodeURIComponent(id)}&pn=${page}&rn=${size}&httpsStatus=1`))
    const card = toPlaylist(data)
    if (!card) throw new MissingError('没有找到这张歌单')
    return {
      ...card,
      cover: str(data.img700 || data.img500 || data.img) || card.cover,
      creatorPic: str(data.uPic),
      tags: str(data.tag)
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      songs: songsOf(data.musicList),
    }
  })
}

/* ---------- 歌手 ---------- */

export type ArtistCard = { id: string; name: string; alias: string; pic: string; fans: number; songCount: number; albumCount: number; mvCount: number }
export type ArtistDetail = ArtistCard & { country: string; birthday: string; birthplace: string; gender: string; language: string; info: string[] }
export type ArtistPage = { list: ArtistCard[]; total: number }

function toArtist(raw: Json): ArtistCard | null {
  const id = str(raw.id)
  if (!/^\d+$/.test(id)) return null
  return {
    id,
    name: plainText(raw.name) || '未知歌手',
    alias: plainText(raw.aartist),
    pic: str(raw.pic300 || raw.pic || raw.pic120),
    fans: num(raw.artistFans),
    songCount: num(raw.musicNum),
    albumCount: num(raw.albumNum),
    mvCount: num(raw.mvNum),
  }
}

export const ARTIST_CATEGORIES = [
  { id: '0', name: '热门' },
  { id: '1', name: '华语男' },
  { id: '2', name: '华语女' },
  { id: '3', name: '华语组合' },
  { id: '4', name: '日韩男' },
  { id: '5', name: '日韩女' },
  { id: '6', name: '日韩组合' },
  { id: '7', name: '欧美男' },
  { id: '8', name: '欧美女' },
  { id: '9', name: '欧美组合' },
] as const

export function fetchArtists(category = '0', page = 1, size = 30): Promise<ArtistPage> {
  return remember(`artist:list:${category}:${page}:${size}`, async () => {
    const data = body(await getJson(`/api/www/artist/artistInfo?category=${encodeURIComponent(category)}&pn=${page}&rn=${size}&httpsStatus=1`))
    return {
      list: rows(data.artistList).map(toArtist).filter((item): item is ArtistCard => item !== null),
      total: num(data.total),
    }
  })
}

export function fetchArtist(id: string): Promise<ArtistDetail> {
  return remember(`artist:${id}`, async () => {
    const data = body(await getJson(`/api/www/artist/artist?artistid=${encodeURIComponent(id)}&httpsStatus=1`))
    const card = toArtist(data)
    if (!card) throw new MissingError('没有找到这位歌手')
    return {
      ...card,
      country: plainText(data.country),
      birthday: plainText(data.birthday),
      birthplace: plainText(data.birthplace),
      gender: plainText(data.gener),
      language: plainText(data.language).replace(/;+$/, '').replace(/;/g, '、'),
      info: paragraphs(data.info),
    }
  })
}

export function fetchArtistSongs(id: string, page = 1, size = 50): Promise<{ songs: MusicItem[]; total: number }> {
  return remember(`artist:songs:${id}:${page}:${size}`, async () => {
    const data = body(await getJson(`/api/www/artist/artistMusic?artistid=${encodeURIComponent(id)}&pn=${page}&rn=${size}&httpsStatus=1`))
    return { songs: songsOf(data.list), total: num(data.total) }
  })
}

/* ---------- 专辑 ---------- */

export type AlbumCard = { id: string; name: string; artist: string; artistId: string; pic: string; date: string }
export type AlbumDetail = AlbumCard & { info: string[]; lang: string; plays: number; total: number; songs: MusicItem[] }

function toAlbum(raw: Json): AlbumCard | null {
  const id = str(raw.albumid || raw.id)
  if (!/^\d+$/.test(id) || Number(id) <= 0) return null
  return {
    id,
    name: plainText(raw.album || raw.name) || '未命名专辑',
    artist: plainText(raw.artist),
    artistId: str(raw.artistid),
    pic: str(raw.pic || raw.albumpic),
    date: plainText(raw.releaseDate || raw.releasedate),
  }
}

export function fetchArtistAlbums(id: string, page = 1, size = 20): Promise<{ list: AlbumCard[]; total: number }> {
  return remember(`artist:albums:${id}:${page}:${size}`, async () => {
    const data = body(await getJson(`/api/www/artist/artistAlbum?artistid=${encodeURIComponent(id)}&pn=${page}&rn=${size}&httpsStatus=1`))
    return {
      list: rows(data.albumList).map(toAlbum).filter((item): item is AlbumCard => item !== null),
      total: num(data.total),
    }
  })
}

export function fetchAlbum(id: string, page = 1, size = 100): Promise<AlbumDetail> {
  return remember(`album:${id}:${page}:${size}`, async () => {
    const data = body(await getJson(`/api/www/album/albumInfo?albumId=${encodeURIComponent(id)}&pn=${page}&rn=${size}&httpsStatus=1`))
    const card = toAlbum(data)
    if (!card) throw new MissingError('没有找到这张专辑')
    return {
      ...card,
      info: paragraphs(data.albuminfo),
      lang: plainText(data.lang),
      plays: num(data.playCnt),
      total: num(data.total),
      songs: songsOf(data.musicList),
    }
  })
}

/** 酷我没有单独的新碟接口：从几张新歌榜里按专辑归并，按发行日期排。 */
export function fetchNewAlbums(): Promise<AlbumCard[]> {
  return remember('album:new', async () => {
    const pages = await Promise.allSettled([fetchChartSongs('17', 1, 100), fetchChartSongs('330', 1, 60), fetchChartSongs('153', 1, 60)])
    const albums = new Map<string, AlbumCard>()
    for (const page of pages) {
      if (page.status !== 'fulfilled') continue
      for (const song of page.value.songs) {
        if (!song.albumId || !song.album || albums.has(song.albumId)) continue
        albums.set(song.albumId, {
          id: song.albumId,
          name: song.album,
          artist: song.artist,
          artistId: song.artistId ?? '',
          pic: song.image ?? '',
          date: song.releaseDate ?? '',
        })
      }
    }
    if (!albums.size) throw new Error(NETWORK_TIP)
    return [...albums.values()].sort((left, right) => right.date.localeCompare(left.date))
  })
}

/* ---------- 单曲、首页物料 ---------- */

export function fetchSong(id: string): Promise<MusicItem> {
  return remember(`song:${id}`, async () => {
    const song = toSong(body(await getJson(`/api/www/music/musicInfo?mid=${encodeURIComponent(id)}&httpsStatus=1`)))
    if (!song) throw new MissingError('没有找到这首歌')
    return song
  })
}

export type BannerItem = { id: string; pic: string; label: string; title: string; href: string }

const LINK_ROUTES: Record<string, string> = {
  playlist_detail: 'playlist',
  album_detail: 'album',
  singer_detail: 'artist',
  play_detail: 'song',
}

/** 把酷我站内链接换成本站页面；换不了的（下载客户端等）不展示。 */
function localLink(url: string) {
  const matched = /kuwo\.cn\/(playlist_detail|album_detail|singer_detail|play_detail)\/(\d+)/.exec(url)
  if (!matched?.[1] || !matched[2]) return ''
  return `#/${LINK_ROUTES[matched[1]]}/${matched[2]}`
}

export function fetchBanners(): Promise<BannerItem[]> {
  return remember('banner', async () => {
    const data = await getJson('/api/www/banner/index/bannerList')
    return rows(data.data)
      .map((raw) => {
        const [label = '', ...rest] = plainText(raw.newPicText).split('|')
        const title = displayCopy(rest.join(' ') || label)
        if (isHiddenPublicId(raw.id) || isHiddenPublicId(title)) return null
        return {
          id: str(raw.id),
          pic: str(raw.newPic || raw.pic),
          label: displayName(rest.length ? label : '推荐') || '推荐',
          title,
          href: localLink(str(raw.url)),
        }
      })
      .filter((item): item is BannerItem => item !== null && Boolean(item.pic && item.href && item.title))
  })
}

export function fetchHotKeywords(): Promise<string[]> {
  return remember('hot-keywords', async () => {
    const data = await getJson('/api/www/search/searchKey?key=&httpsStatus=1')
    const words: unknown[] = Array.isArray(data.data) ? data.data : []
    return [...new Set(words.map((item) => plainText(item)).filter(Boolean))].slice(0, 20)
  })
}
