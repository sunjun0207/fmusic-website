import { useEffect } from 'react'
import type { Route, RouteName } from './route'
import { PRODUCT, SLOGAN } from './site'

const NAMES: Record<RouteName, string> = {
  home: '',
  discover: '发现音乐',
  daily: '每日推荐',
  toplist: '排行榜',
  playlists: '歌单',
  playlist: '歌单',
  artists: '歌手',
  artist: '歌手',
  albums: '新碟上架',
  album: '专辑',
  song: '歌曲',
  radio: '音乐电台',
  community: '音乐社区',
  vip: '会员中心',
  mine: '我的音乐',
  download: '听歌说明',
  about: '关于音浪',
  search: '搜索',
  notfound: '页面走丢了',
}

export function documentTitle(route: Route) {
  if (route.name === 'home') return `${PRODUCT} - ${SLOGAN.replace(/。$/, '')}`
  if (route.name === 'search' && route.q) return `搜索 ${route.q} - ${PRODUCT}`
  return `${NAMES[route.name]} - ${PRODUCT}`
}

/** 详情页拿到名字后再改标题；App 用 layout effect 先写通用标题，这里每次渲染后都晚一步覆盖回来。 */
export function usePageTitle(...parts: (string | undefined)[]) {
  const text = parts.filter(Boolean).join(' - ')
  useEffect(() => {
    if (text) document.title = `${text} - ${PRODUCT}`
  })
}
