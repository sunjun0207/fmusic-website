import { API_BASE } from './api'
import { plainText } from './text'

export type LyricLine = {
  time: number
  lineLyric: string
}

const lyricCache = new Map<string, Promise<LyricLine[]>>()

export function getLyric(musicId: string): Promise<LyricLine[]> {
  const cached = lyricCache.get(musicId)
  if (cached) return cached
  const job = fetchLyric(musicId).catch((error: unknown) => {
    lyricCache.delete(musicId)
    throw error
  })
  lyricCache.set(musicId, job)
  return job
}

export function prefetchLyric(musicId: string) {
  void getLyric(musicId).catch(() => undefined)
}

async function fetchLyric(musicId: string): Promise<LyricLine[]> {
  const res = await fetch(`${API_BASE}/kw-openapi/openapi/v1/www/lyric/getlyric?musicId=${encodeURIComponent(musicId)}`)
  if (!res.ok) throw new Error('歌词获取失败')
  const data = (await res.json()) as {
    data?: { lrclist?: LyricLine[]; lrcList?: LyricLine[] }
  }
  const list = data.data?.lrclist ?? data.data?.lrcList ?? []
  return list
    .map((line) => ({
      time: Number(line.time) || 0,
      lineLyric: plainText(line.lineLyric),
    }))
    .filter((line) => line.lineLyric)
    .sort((a, b) => a.time - b.time)
}
