import { charts, getAlbum, getArtist, getChart, getPlaylist } from '../data/catalog'
import type { Route } from './route'
import { PRODUCT } from './site'

export function documentTitle(route: Route) {
  const base = PRODUCT
  switch (route.name) {
    case 'discover':
      return `${base} - 发现音乐`
    case 'toplist': {
      const chart = (route.id ? getChart(route.id) : undefined) ?? charts[0]
      return chart ? `${chart.title} - 排行榜 - ${base}` : `排行榜 - ${base}`
    }
    case 'playlists':
      return `歌单 - ${base}`
    case 'playlist': {
      const item = route.id ? getPlaylist(route.id) : undefined
      return item ? `${item.title} - 歌单 - ${base}` : `歌单 - ${base}`
    }
    case 'artists':
      return `歌手 - ${base}`
    case 'artist': {
      const item = route.id ? getArtist(route.id) : undefined
      return item ? `${item.name} - 歌手 - ${base}` : `歌手 - ${base}`
    }
    case 'albums':
      return `新碟上架 - ${base}`
    case 'album': {
      const item = route.id ? getAlbum(route.id) : undefined
      return item ? `${item.title} - 专辑 - ${base}` : `专辑 - ${base}`
    }
    case 'download':
      return `下载客户端 - ${base}`
    case 'about':
      return `关于 - ${base}`
    case 'favorites':
      return `收藏 - ${base}`
    case 'search':
      return route.q ? `搜索 ${route.q} - ${base}` : `搜索 - ${base}`
    default:
      return `未找到页面 - ${base}`
  }
}
