import { useEffect, useState } from 'react'

export type RouteName =
  | 'home'
  | 'discover'
  | 'daily'
  | 'toplist'
  | 'playlists'
  | 'playlist'
  | 'artists'
  | 'artist'
  | 'albums'
  | 'album'
  | 'song'
  | 'radio'
  | 'community'
  | 'vip'
  | 'mine'
  | 'download'
  | 'about'
  | 'search'
  | 'notfound'

export type Route = {
  name: RouteName
  id?: string
  q: string
  page: number
  params: Record<string, string>
  key: string
}

export const HOME_HASH = '#/home'

export function searchHash(q: string, page = 1) {
  const params = new URLSearchParams()
  const keyword = q.trim()
  if (keyword) params.set('q', keyword)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `#/search?${qs}` : '#/search'
}

/** 拼带查询参数的地址，空值和第 1 页不写进去。 */
export function hashWith(path: string, query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  for (const [name, value] of Object.entries(query)) {
    if (value === undefined || value === '') continue
    if (name === 'page' && Number(value) <= 1) continue
    params.set(name, String(value))
  }
  const qs = params.toString()
  return qs ? `#${path}?${qs}` : `#${path}`
}

function parsePage(value: string | null) {
  const page = Number(value)
  if (!Number.isInteger(page) || page < 1) return 1
  return page
}

const KNOWN = new Set<RouteName>([
  'home',
  'discover',
  'daily',
  'toplist',
  'playlists',
  'playlist',
  'artists',
  'artist',
  'albums',
  'album',
  'song',
  'radio',
  'community',
  'vip',
  'mine',
  'download',
  'about',
  'search',
])

const ALIAS: Record<string, RouteName> = {
  favorites: 'mine',
}

const NEED_ID = new Set<RouteName>(['playlist', 'artist', 'album', 'song'])

function decodePart(part: string) {
  try {
    return decodeURIComponent(part)
  } catch {
    return part
  }
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/home'
  const qIndex = raw.indexOf('?')
  const path = qIndex >= 0 ? raw.slice(0, qIndex) : raw
  const query = qIndex >= 0 ? raw.slice(qIndex + 1) : ''
  const search = new URLSearchParams(query)
  const params = Object.fromEntries(search.entries())
  const parts = path.split('/').filter(Boolean).map(decodePart)
  const head = parts[0] || 'home'
  const name = ALIAS[head] ?? (head as RouteName)
  const id = parts[1]
  const q = search.get('q') ?? ''
  const page = parsePage(search.get('page'))
  const key = `${name}/${id ?? ''}?${search.toString()}`
  if (!KNOWN.has(name) || (NEED_ID.has(name) && !id)) return { name: 'notfound', q, page, params, key }
  return { name, id, q, page, params, key }
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))

  useEffect(() => {
    const sync = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', sync)
    if (!window.location.hash) window.location.replace(HOME_HASH)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  return route
}
