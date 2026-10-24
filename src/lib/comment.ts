import { API_BASE } from './api'
import { plainText } from './text'

export type SongComment = {
  id: string
  user: string
  text: string
  time: string
  likes: number
  avatar: string
}

type RawRow = {
  id?: string
  msg?: string
  u_name?: string
  u_pic?: string
  time?: string
  like_num?: string
}

type RawPage = {
  rows?: RawRow[]
  total?: string | number
  result?: string
}

function commentText(value: unknown) {
  return String(value ?? '')
    .split(/\n/)
    .map((line) => plainText(line))
    .filter(Boolean)
    .join('\n')
}

function mapRow(row: RawRow, index: number): SongComment | null {
  const text = commentText(row.msg)
  if (!text) return null
  const avatar = String(row.u_pic ?? '')
  return {
    id: String(row.id || `${index}-${text.slice(0, 12)}`),
    user: plainText(row.u_name) || '听众',
    text,
    time: plainText(row.time),
    likes: Number(row.like_num) || 0,
    avatar: /^https?:\/\//i.test(avatar) ? avatar : '',
  }
}

async function readCommentPage(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('评论加载失败')
  const text = (await res.text()).trim()
  if (!text.startsWith('{')) throw new Error('评论加载失败')
  const data = JSON.parse(text) as RawPage
  if (data.result && data.result !== 'ok') throw new Error('评论加载失败')
  const list = (data.rows ?? []).map(mapRow).filter((item): item is SongComment => !!item)
  return { list, total: Number(data.total) || list.length }
}

async function fetchPage(rid: string, page: number, rows: number, type: 'get_comment' | 'get_rec_comment') {
  const qs = new URLSearchParams({
    type,
    f: 'web',
    page: String(page),
    rows: String(rows),
    digest: '15',
    sid: rid,
    uid: '0',
    prod: 'newWeb',
  })
  return readCommentPage(`${API_BASE}/kw-comment/com.s?${qs}`)
}

export function fetchComments(rid: string, page = 1, rows = 20) {
  return fetchPage(rid, page, rows, 'get_comment')
}

const danmakuCache = new Map<string, Promise<SongComment[]>>()

export function fetchDanmaku(rid: string) {
  const cached = danmakuCache.get(rid)
  if (cached) return cached
  const job = fetchPage(rid, 1, 30, 'get_rec_comment')
    .catch(() => ({ list: [] as SongComment[], total: 0 }))
    .then((hot) => (hot.list.length ? hot.list : fetchPage(rid, 1, 20, 'get_comment').then((page) => page.list)))
    .catch((error: unknown) => {
      danmakuCache.delete(rid)
      throw error
    })
  danmakuCache.set(rid, job)
  return job
}
