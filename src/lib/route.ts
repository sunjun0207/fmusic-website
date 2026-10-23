import { useEffect, useState } from 'react'

export type RouteName =
  | 'discover'
  | 'toplist'
  | 'playlists'
  | 'playlist'
  | 'artists'
  | 'artist'
  | 'albums'
  | 'album'
  | 'download'
  | 'about'
  | 'search'
  | 'notfound'

export type Route = {
  name: RouteName
  id?: string
  q: string
  tag: string
  page: number
  key: string
}

export function searchHash(q: string, page = 1) {
  const params = new URLSearchParams()
  const keyword = q.trim()
  if (keyword) params.set('q', keyword)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `#/search?${qs}` : '#/search'
}

function parsePage(value: string | null) {
  const page = Number(value)
  if (!Number.isInteger(page) || page < 1) return 1
  return page
}

const KNOWN = new Set<RouteName>([
  'discover',
  'toplist',
  'playlists',
  'playlist',
  'artists',
  'artist',
  'albums',
  'album',
  'download',
  'about',
  'search',
])

function decodePart(part: string) {
  try {
    return decodeURIComponent(part)
  } catch {
    return part
  }
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/discover'
  const qIndex = raw.indexOf('?')
  const path = qIndex >= 0 ? raw.slice(0, qIndex) : raw
  const query = qIndex >= 0 ? raw.slice(qIndex + 1) : ''
  const params = new URLSearchParams(query)
  const parts = path.split('/').filter(Boolean).map(decodePart)
  const head = parts[0] || 'discover'
  const id = parts[1]
  const q = params.get('q') ?? ''
  const tag = params.get('tag') ?? ''
  const page = parsePage(params.get('page'))
  const key = `${head}/${id ?? ''}?q=${q}&tag=${tag}&page=${page}`
  if (!KNOWN.has(head as RouteName)) return { name: 'notfound', q, tag, page, key }
  if ((head === 'playlist' || head === 'artist' || head === 'album') && !id) {
    return { name: 'notfound', q, tag, page, key }
  }
  return { name: head as RouteName, id, q, tag, page, key }
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))

  useEffect(() => {
    const sync = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', sync)
    if (!window.location.hash) window.location.replace('#/discover')
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  return route
}
