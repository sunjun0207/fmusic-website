import { buildMvNmobiPath, buildNmobiPath } from './kuwoDes'

const KUWO_KW_HOST = /^kw-[a-z0-9-]+\.kuwo\.cn$/i
const KUWO_MEDIA_HOST = /^(?:kw-[a-z0-9-]+|mp4dl\.cdn)\.kuwo\.cn$/i

export type MvQuality = 'sd' | 'hd' | 'fhd'

const MV_QUALITY_CODE: Record<MvQuality, string> = {
  sd: '480',
  hd: '720',
  fhd: '2000',
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
    return `/proxy/kw-audio/${parsed.hostname}${parsed.pathname}${parsed.search}`
  } catch {
    return url
  }
}

const mediaCache = new Map<string, Promise<string>>()

export function getMediaUrl(rid: string, kind: 'audio' | 'mv', quality: MvQuality = 'fhd'): Promise<string> {
  const key = kind === 'mv' ? `${kind}:${rid}:${quality}` : `${kind}:${rid}`
  const cached = mediaCache.get(key)
  if (cached) return cached
  const job = fetchMediaUrl(rid, kind, quality).catch((error: unknown) => {
    mediaCache.delete(key)
    throw error
  })
  mediaCache.set(key, job)
  return job
}

export function prefetchMedia(rid: string, kind: 'audio' | 'mv', quality: MvQuality = 'fhd') {
  void getMediaUrl(rid, kind, quality).catch(() => undefined)
}

async function fetchMediaUrl(rid: string, kind: 'audio' | 'mv', quality: MvQuality): Promise<string> {
  if (kind === 'mv') return fetchMvUrl(rid, quality)
  const res = await fetch(buildNmobiPath(rid))
  if (!res.ok) throw new Error('播放地址获取失败')
  const map = parseBody(await res.text())
  if (!map.url) throw new Error('未获取到播放地址')
  return rewriteMediaUrl(map.url)
}

function isPlayableVideo(url: string) {
  return /^https?:\/\//i.test(url) && /\.mp4(?:$|[?#])/i.test(url)
}

async function fetchMvUrl(rid: string, quality: MvQuality): Promise<string> {
  const code = MV_QUALITY_CODE[quality]
  const web = `/proxy/kw-nmobi/mobi.s?f=web&type=convert_mv_url&rid=${encodeURIComponent(rid)}&quality=${code}&format=mp4`
  try {
    const res = await fetch(web)
    const text = (await res.text()).trim().split(/\s+/)[0] ?? ''
    if (res.ok && isPlayableVideo(text)) return toProxyMediaUrl(text)
  } catch {
    /* 清晰度地址失败时退回默认可播地址 */
  }
  const res = await fetch(buildMvNmobiPath(rid))
  if (!res.ok) throw new Error('MV 地址获取失败')
  const map = parseBody(await res.text())
  if (!map.url || !isPlayableVideo(map.url)) throw new Error('这首歌暂时没有可播放的 MV')
  return rewriteMediaUrl(map.url)
}
