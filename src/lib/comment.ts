import { API_BASE } from './api'
import { plainText } from './text'

export type SongComment = {
  id: string
  user: string
  text: string
  time: string
  likes: number
  avatar: string
  medal: string
  medalLevel: number
  rank: number
  parentId: string
  replies: SongComment[]
}

type RawRow = {
  id?: string
  msg?: string
  u_name?: string
  u_pic?: string
  time?: string
  like_num?: string
  medalName?: string
  medalLevel?: string | number
  rankVal?: string | number
  reply?: RawRow | RawRow[] | null
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

function marks(row: RawRow) {
  const medal = plainText(row.medalName)
  const medalLevel = Number(row.medalLevel) || 0
  const rank = Number(row.rankVal) || 0
  return {
    medal,
    medalLevel: medal && medalLevel > 0 ? medalLevel : 0,
    rank: rank > 0 ? rank : 0,
  }
}

function parentRow(row: RawRow) {
  const reply = row.reply
  if (!reply) return null
  const source = Array.isArray(reply) ? reply.find((item) => item?.id) : reply
  if (!source?.id || String(source.id) === String(row.id ?? '')) return null
  return source
}

function toComment(row: RawRow, index: number, parentId: string): SongComment | null {
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
    ...marks(row),
    parentId,
    replies: [],
  }
}

export function mergeComment(prev: SongComment, next: SongComment): SongComment {
  return {
    id: prev.id,
    user: next.user || prev.user,
    text: next.text || prev.text,
    time: next.time || prev.time,
    likes: Math.max(prev.likes, next.likes),
    avatar: next.avatar || prev.avatar,
    medal: next.medal || prev.medal,
    medalLevel: next.medalLevel || prev.medalLevel,
    rank: next.rank || prev.rank,
    parentId: next.parentId || prev.parentId,
    replies: [],
  }
}

function absorb(bucket: Map<string, SongComment>, row: RawRow, index: number, seen: Set<string>) {
  const parent = parentRow(row)
  const parentId = parent?.id ? String(parent.id) : ''
  const node = toComment(row, index, parentId)
  if (!node || seen.has(node.id)) return
  seen.add(node.id)
  const prev = bucket.get(node.id)
  bucket.set(node.id, prev ? mergeComment(prev, node) : node)
  if (parent) absorb(bucket, parent, index, seen)
}

export function flatComments(rows: RawRow[]) {
  const bucket = new Map<string, SongComment>()
  rows.forEach((row, index) => absorb(bucket, row, index, new Set()))
  return [...bucket.values()]
}

function ancestor(id: string, nodes: Map<string, SongComment>) {
  const seen = new Set<string>()
  let current = nodes.get(id)
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    current = current.parentId ? nodes.get(current.parentId) : undefined
  }
  return seen
}

export function threadComments(items: SongComment[]) {
  const nodes = new Map<string, SongComment>()
  for (const item of items) {
    const prev = nodes.get(item.id)
    nodes.set(item.id, { ...(prev ? mergeComment(prev, item) : item), replies: [] })
  }
  const roots: SongComment[] = []
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined
    if (!parent || parent.id === node.id || ancestor(parent.id, nodes).has(node.id)) {
      roots.push(node)
      continue
    }
    parent.replies.push(node)
  }
  return roots
}

export function appendComments(current: SongComment[], incoming: SongComment[]) {
  const bucket = new Map(current.map((item) => [item.id, item]))
  for (const item of incoming) {
    const prev = bucket.get(item.id)
    bucket.set(item.id, prev ? mergeComment(prev, item) : item)
  }
  return [...bucket.values()]
}

export function formatCommentCount(value: number) {
  if (value < 10000) return String(value)
  const text = (value / 10000).toFixed(value >= 100000 ? 0 : 1).replace(/\.0$/, '')
  return `${text}万`
}

async function readRows(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('评论加载失败')
  const text = (await res.text()).trim()
  if (!text.startsWith('{')) throw new Error('评论加载失败')
  const data = JSON.parse(text) as RawPage
  if (data.result && data.result !== 'ok') throw new Error('评论加载失败')
  return { rows: data.rows ?? [], total: Number(data.total) || (data.rows ?? []).length }
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
  return readRows(`${API_BASE}/kw-comment/com.s?${qs}`)
}

function ownComments(rows: RawRow[]) {
  return rows.flatMap((row, index) => {
    const parent = parentRow(row)
    const node = toComment(row, index, parent?.id ? String(parent.id) : '')
    return node ? [node] : []
  })
}

export function fetchComments(rid: string, page = 1, rows = 20) {
  return fetchPage(rid, page, rows, 'get_comment').then((pageData) => ({
    list: flatComments(pageData.rows),
    total: pageData.total,
    size: pageData.rows.length,
  }))
}

const danmakuCache = new Map<string, Promise<SongComment[]>>()

export function fetchDanmaku(rid: string) {
  const cached = danmakuCache.get(rid)
  if (cached) return cached
  const job = fetchPage(rid, 1, 30, 'get_rec_comment')
    .catch(() => ({ rows: [] as RawRow[], total: 0 }))
    .then((hot) => {
      if (hot.rows.length) return ownComments(hot.rows)
      return fetchPage(rid, 1, 20, 'get_comment').then((page) => ownComments(page.rows))
    })
    .catch((error: unknown) => {
      danmakuCache.delete(rid)
      throw error
    })
  danmakuCache.set(rid, job)
  return job
}
