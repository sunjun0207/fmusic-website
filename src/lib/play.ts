import { API_BASE } from './api'
import { buildMvNmobiPath, buildNmobiPath } from './kuwoDes'
import { endpoint, useProxy } from './source'

const KUWO_KW_HOST = /^kw-[a-z0-9-]+\.kuwo\.cn$/i
const KUWO_MEDIA_HOST = /(?:^|\.)kuwo\.cn$/i

export type MvQuality = 'sd' | 'hd' | 'fhd'

const MV_QUALITY_CODE: Record<MvQuality, string> = {
  sd: 'EXMP4L',
  hd: 'EXMP4HV',
  fhd: 'EXMP4UL',
}

const MV_ORDER: MvQuality[] = ['sd', 'hd', 'fhd']

const QUALITY_FORMATS: Record<MvQuality, string[]> = {
  sd: ['EXMP4L', 'MP4L'],
  hd: ['EXMP4HV', 'MP4HV'],
  fhd: ['EXMP4UL', 'EXMP4BD', 'MP4UL', 'MP4BD'],
}

export function listedMvQualities(formats?: string[]): MvQuality[] | null {
  if (!formats?.length) return null
  const known = new Set(formats.map((item) => item.toUpperCase()))
  const listed = MV_ORDER.filter((quality) => QUALITY_FORMATS[quality].some((code) => known.has(code)))
  return listed.length > 0 ? listed : ['sd']
}

export function rewriteMediaUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (!KUWO_KW_HOST.test(parsed.hostname)) return url
    if (parsed.protocol === 'https:') return url
    return `https://${url.slice('http://'.length)}`
  } catch {
    return url
  }
}

function parseBody(text: string) {
  const map: Record<string, string> = {}
  text.split(/\r?\n/).forEach((line) => {
    const idx = line.indexOf('=')
    if (idx > 0) map[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  })
  return map
}

export function toProxyMediaUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (!KUWO_MEDIA_HOST.test(parsed.hostname)) return url
    return `${API_BASE}/kw-audio/${parsed.hostname}${parsed.pathname}${parsed.search}`
  } catch {
    return url
  }
}

const mediaCache = new Map<string, Promise<string>>()

export function sameMediaFile(left: string, right: string) {
  return mediaFileKey(left) === mediaFileKey(right)
}

function mediaFileKey(url: string) {
  const file = url.match(/(\d+)\.mp4/i)?.[1]
  if (file) return file
  try {
    const parsed = new URL(url, 'http://local')
    return parsed.pathname.split('/').filter(Boolean)[0] || url
  } catch {
    return url
  }
}

async function fetchQualityToken(rid: string, quality: MvQuality) {
  const code = MV_QUALITY_CODE[quality]
  const web = endpoint('nmobi', `/mobi.s?f=web&type=convert_mv_url&rid=${encodeURIComponent(rid)}&quality=${code}&format=mp4`)
  const res = await fetch(web, { signal: AbortSignal.timeout(8000) })
  const text = (await res.text()).trim().split(/\s+/)[0] ?? ''
  if (!res.ok || !/^https?:\/\//i.test(text)) return ''
  return mediaFileKey(text)
}

const playableQualityCache = new Map<string, Promise<MvQuality[]>>()

export function getPlayableMvQualities(rid: string, mvId = '', formats?: string[]): Promise<MvQuality[]> {
  const key = `${rid}:${mvId}:${(formats ?? []).join('|')}`
  const cached = playableQualityCache.get(key)
  if (cached) return cached
  const job = resolvePlayableMvQualities(rid, mvId, formats).catch((error: unknown) => {
    playableQualityCache.delete(key)
    throw error
  })
  playableQualityCache.set(key, job)
  return job
}

async function resolvePlayableMvQualities(rid: string, mvId: string, formats?: string[]) {
  const catalog = listedMvQualities(formats)
  const candidates = catalog ?? MV_ORDER
  const ids = [...new Set([mvId, rid].filter(Boolean))]
  const tokens = await Promise.all(
    candidates.map(async (quality) => {
      for (const id of ids) {
        try {
          const token = await fetchQualityToken(id, quality)
          if (token) return [quality, token] as const
        } catch {
          /* 换下一个编号继续确认这一档 */
        }
      }
      return [quality, ''] as const
    }),
  )
  const seen = new Set<string>()
  const playable: MvQuality[] = []
  for (const [quality, token] of tokens) {
    if (!token || seen.has(token)) continue
    seen.add(token)
    playable.push(quality)
  }
  const fallback: MvQuality[] = ['sd']
  return playable.length > 0 ? playable : fallback
}

export function getMediaUrl(rid: string, kind: 'audio' | 'mv', quality: MvQuality = 'fhd', mvId = ''): Promise<string> {
  const key = kind === 'mv' ? `${kind}:${rid}:${mvId}:${quality}` : `${kind}:${rid}`
  const cached = mediaCache.get(key)
  if (cached) return cached
  const job = fetchMediaUrl(rid, kind, quality, mvId).catch((error: unknown) => {
    mediaCache.delete(key)
    throw error
  })
  mediaCache.set(key, job)
  return job
}

export function prefetchMedia(rid: string, kind: 'audio' | 'mv', quality: MvQuality = 'fhd', mvId = '') {
  void getMediaUrl(rid, kind, quality, mvId).catch(() => undefined)
}

async function fetchMediaUrl(rid: string, kind: 'audio' | 'mv', quality: MvQuality, mvId = ''): Promise<string> {
  if (kind === 'mv') return fetchMvUrl(rid, quality, mvId)
  const res = await fetch(buildNmobiPath(rid))
  if (!res.ok) throw new Error('播放地址获取失败')
  const map = parseBody(await res.text())
  if (!map.url) throw new Error('未获取到播放地址')
  return rewriteMediaUrl(map.url)
}

function isDirectVideo(url: string) {
  return /^https?:\/\//i.test(url) && /\.mp4(?:$|[?#])/i.test(url)
}

let gatewayAlive: Promise<boolean> | null = null

async function readVideoHead(proxyUrl: string) {
  const res = await fetch(proxyUrl, {
    headers: { Range: 'bytes=0-31' },
    signal: AbortSignal.timeout(5000),
  })
  if (!(res.ok || res.status === 206) || !res.body) return false
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < 16) {
    const { done, value } = await reader.read()
    if (done || !value) break
    chunks.push(value)
    size += value.length
  }
  await reader.cancel().catch(() => undefined)
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk.subarray(0, bytes.length - offset), offset)
    offset += chunk.length
  }
  return bytes.length >= 8 && String.fromCharCode(bytes[4]!, bytes[5]!, bytes[6]!, bytes[7]!) === 'ftyp'
}

async function acceptQualityUrl(url: string) {
  if (isDirectVideo(url)) return useProxy ? toProxyMediaUrl(url) : rewriteMediaUrl(url)
  const proxied = toProxyMediaUrl(url)
  if (!proxied.startsWith(`${API_BASE}/`)) return ''
  if (!gatewayAlive) {
    const check = readVideoHead(proxied).catch(() => false)
    gatewayAlive = check
    return (await check) ? proxied : ''
  }
  if (!(await gatewayAlive)) return ''
  return (await readVideoHead(proxied).catch(() => false)) ? proxied : ''
}

async function fetchQualityUrl(rid: string, quality: MvQuality) {
  const code = MV_QUALITY_CODE[quality]
  const web = endpoint('nmobi', `/mobi.s?f=web&type=convert_mv_url&rid=${encodeURIComponent(rid)}&quality=${code}&format=mp4`)
  const res = await fetch(web, { signal: AbortSignal.timeout(8000) })
  const text = (await res.text()).trim().split(/\s+/)[0] ?? ''
  if (!res.ok || !/^https?:\/\//i.test(text)) return ''
  return acceptQualityUrl(text)
}

async function fetchFallbackMv(rid: string) {
  const res = await fetch(buildMvNmobiPath(rid))
  if (!res.ok) throw new Error('MV 地址获取失败')
  const map = parseBody(await res.text())
  if (!map.url || !isDirectVideo(map.url)) throw new Error('这首歌暂时没有可播放的 MV')
  return rewriteMediaUrl(map.url)
}

async function fetchMvUrl(rid: string, quality: MvQuality, mvId = ''): Promise<string> {
  const ids = [...new Set([mvId, rid].filter(Boolean))]
  for (const id of ids) {
    try {
      const url = await fetchQualityUrl(id, quality)
      if (url) return url
    } catch {
      /* 这个清晰度地址失败时继续试下一条 */
    }
  }
  return fetchFallbackMv(rid)
}
