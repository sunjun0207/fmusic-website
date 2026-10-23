import { buildMvNmobiPath, buildNmobiPath } from './kuwoDes'

const KUWO_MEDIA_HOST = /^kw-[a-z0-9-]+\.kuwo\.cn$/i

export function rewriteMediaUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (!KUWO_MEDIA_HOST.test(parsed.hostname)) return url
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

export function getMediaUrl(rid: string, kind: 'audio' | 'mv'): Promise<string> {
  const key = `${kind}:${rid}`
  const cached = mediaCache.get(key)
  if (cached) return cached
  const job = fetchMediaUrl(rid, kind).catch((error: unknown) => {
    mediaCache.delete(key)
    throw error
  })
  mediaCache.set(key, job)
  return job
}

export function prefetchMedia(rid: string, kind: 'audio' | 'mv') {
  void getMediaUrl(rid, kind).catch(() => undefined)
}

async function fetchMediaUrl(rid: string, kind: 'audio' | 'mv'): Promise<string> {
  const path = kind === 'mv' ? buildMvNmobiPath(rid) : buildNmobiPath(rid)
  const res = await fetch(path)
  if (!res.ok) throw new Error(kind === 'mv' ? 'MV 地址获取失败' : '播放地址获取失败')
  const map = parseBody(await res.text())
  if (!map.url) throw new Error(kind === 'mv' ? '这首歌暂时没有可播放的 MV' : '未获取到播放地址')
  return rewriteMediaUrl(map.url)
}
