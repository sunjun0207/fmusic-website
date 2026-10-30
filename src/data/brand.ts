import type { RouteName } from '../lib/route'

export const NAV: { href: string; label: string; names: RouteName[] }[] = [
  { href: '#/home', label: '首页', names: ['home'] },
  { href: '#/discover', label: '发现音乐', names: ['discover', 'daily', 'artists', 'artist', 'albums', 'album', 'song', 'search'] },
  { href: '#/toplist', label: '排行榜', names: ['toplist'] },
  { href: '#/playlists', label: '歌单', names: ['playlists', 'playlist'] },
  { href: '#/radio', label: '电台', names: ['radio'] },
  { href: '#/community', label: '音乐社区', names: ['community'] },
  { href: '#/vip', label: '会员中心', names: ['vip'] },
]

export type Copy = { en: string; title: string; desc: string }

export const PAGE_COPY = {
  discover: { en: 'DISCOVER', title: '下一首心动，可能就在这里。', desc: '探索未知旋律，发现不一样的音乐世界。' },
  daily: { en: 'DAILY MIX', title: '今天的心情，交给音乐来安排。', desc: '根据你的喜好，遇见专属于你的音乐惊喜。' },
  toplist: { en: 'TOP CHARTS', title: '此刻最热，听点不一样的。', desc: '热门歌曲实时发现，跟上音乐潮流。' },
  radio: { en: 'RADIO', title: '给情绪一个出口，给生活一点旋律。', desc: '从清晨到深夜，总有一段旋律陪伴你。' },
  community: { en: 'COMMUNITY', title: '因为一首歌，认识有趣的人。', desc: '分享你的音乐故事，遇见与你同频的灵魂。' },
  playlists: { en: 'PLAYLISTS', title: '宝藏歌单', desc: '总有一些好音乐，值得被更多人听见。' },
  albums: { en: 'NEW RELEASES', title: '每日新歌', desc: '新鲜音乐准时上架，让耳朵保持新鲜感。' },
  artists: { en: 'ARTISTS', title: '从一个声音，走进一个人的音乐世界。', desc: '华语、日韩、欧美，热门歌手一网打尽。' },
  vip: { en: 'JUN.SUN CLUB', title: '不止听见旋律，更要感受热爱。', desc: '无损音质、超清 MV、歌词弹幕……公测期间全部免费开放。' },
  mine: { en: 'MY UNIVERSE', title: '我的音乐宇宙', desc: '收进来的每一首歌，都是你宇宙里的一颗星。' },
} satisfies Record<string, Copy>

export const HOME_COPY = {
  forYou: { en: 'FOR YOU', title: '为你推荐', desc: '每一次打开，都有新的音乐惊喜。' },
  picks: { en: 'EDITOR PICKS', title: '精选推荐', desc: '五种心情，五种打开方式。' },
  hot: { en: 'HOT NOW', title: '全网热歌', desc: '正在流行的好声音，当然不能错过。' },
  fresh: { en: 'NEW RELEASES', title: '每日新歌', desc: '新鲜音乐准时上架，让耳朵保持新鲜感。' },
  playlists: { en: 'PLAYLISTS', title: '宝藏歌单', desc: '总有一些好音乐，值得被更多人听见。' },
  charts: { en: 'TOP CHARTS', title: '热门排行榜', desc: '大家都在听什么？一起感受当下音乐潮流。' },
  private: { en: 'JUST FOR YOU', title: '私人专属', desc: '懂你的音乐品味，也懂你此刻的心情。' },
  radio: { en: 'RADIO', title: '音乐电台', desc: '给生活一点背景音乐，让平凡日子也有旋律。' },
  community: { en: 'COMMUNITY', title: '音乐社区', desc: '分享喜欢的歌，遇见同频的灵魂。' },
} satisfies Record<string, Copy>

export const BRAND_STORY = {
  title: '音乐，是生活的另一种表达。',
  lines: [
    '有人用音乐记录青春，有人用旋律治愈孤独，也有人在节奏中寻找自由。',
    '聆听希望成为你的音乐灵感空间，让每一份热爱都有回响，让每一次相遇都有声音。',
  ],
  sign: 'jun.sun · 让热爱持续发声。',
}

export const SLOGANS = ['总有一首歌，懂你的此刻。', '让好音乐，找到懂它的人。', '戴上耳机，世界都是你的。', '每一种心情，都值得被听见。']

export const KEYWORDS = ['年轻潮流', '情绪共鸣', '音乐发现', '音乐社交', '沉浸体验']

export type Source = { kind: 'chart' | 'tag'; id: string }

export type Theme = { id: string; title: string; en: string; desc: string; href: string; source: Source; tone: [string, string] }

export const THEMES: Theme[] = [
  { id: 'today', title: '今日必听', en: 'MUST LISTEN', desc: '精选好歌，为今天加一点旋律。', href: '#/toplist/16', source: { kind: 'chart', id: '16' }, tone: ['#FF6B6B', '#E03131'] },
  { id: 'heal', title: '治愈时光', en: 'HEALING', desc: '累了就听听歌，让心情慢慢放晴。', href: '#/playlists?tag=67', source: { kind: 'tag', id: '67' }, tone: ['#38D9A9', '#0CA678'] },
  { id: 'live', title: '潮流现场', en: 'TRENDING', desc: '热门节奏持续加载，释放你的音乐能量。', href: '#/toplist/158', source: { kind: 'chart', id: '158' }, tone: ['#FFA94D', '#F03E3E'] },
  { id: 'night', title: '深夜情绪', en: 'MIDNIGHT', desc: '当世界安静下来，让音乐替你表达。', href: '#/playlists?tag=146', source: { kind: 'tag', id: '146' }, tone: ['#748FFC', '#4263EB'] },
  { id: 'indie', title: '独立音乐', en: 'INDIE', desc: '发现不一样的声音，收藏属于你的宝藏。', href: '#/playlists?tag=392', source: { kind: 'tag', id: '392' }, tone: ['#B197FC', '#7048E8'] },
]

export type Station = { id: string; name: string; en: string; slogan: string; tagId: string; hours: number[]; tone: [string, string] }

export const STATIONS: Station[] = [
  { id: 'morning', name: '清晨唤醒', en: 'MORNING', slogan: '第一缕阳光，配一首干净的歌。', tagId: '353', hours: [5, 6, 7, 8], tone: ['#FFC078', '#FA5252'] },
  { id: 'commute', name: '通勤路上', en: 'COMMUTE', slogan: '把拥挤的路，听成自己的风景。', tagId: '2202', hours: [9, 17, 18], tone: ['#4DABF7', '#1C7ED6'] },
  { id: 'focus', name: '专注学习', en: 'FOCUS', slogan: '降噪模式开启，只留旋律陪你。', tagId: '1876', hours: [10, 11, 14, 15], tone: ['#3BC9DB', '#1098AD'] },
  { id: 'work', name: '工作 BGM', en: 'WORK', slogan: '效率在线，节奏刚刚好。', tagId: '386', hours: [12, 13, 16], tone: ['#74C0FC', '#4263EB'] },
  { id: 'workout', name: '运动燃脂', en: 'WORKOUT', slogan: '心跳跟上节拍，汗水也有旋律。', tagId: '366', hours: [19], tone: ['#FF8787', '#E03131'] },
  { id: 'home', name: '宅家时光', en: 'STAY HOME', slogan: '窝进沙发，世界只剩音乐和你。', tagId: '2203', hours: [20, 21], tone: ['#FAA2C1', '#E64980'] },
  { id: 'midnight', name: '深夜情绪', en: 'MIDNIGHT', slogan: '当世界安静下来，让音乐替你表达。', tagId: '146', hours: [22, 23, 0], tone: ['#5C7CFA', '#364FC7'] },
  { id: 'sleep', name: '助眠电台', en: 'SLEEP', slogan: '把灯关上，让旋律替你数羊。', tagId: '354', hours: [1, 2, 3, 4], tone: ['#91A7FF', '#6741D9'] },
  { id: 'drive', name: '开车兜风', en: 'DRIVE', slogan: '车窗半开，音量刚好。', tagId: '376', hours: [], tone: ['#FFA94D', '#E8590C'] },
  { id: 'citywalk', name: 'Citywalk', en: 'CITYWALK', slogan: '慢慢走，城市也会给你写歌。', tagId: '2214', hours: [], tone: ['#69DB7C', '#2F9E44'] },
]

export function stationForHour(hour = new Date().getHours()) {
  return STATIONS.find((station) => station.hours.includes(hour)) ?? (STATIONS[0] as Station)
}

export const PERKS = [
  { icon: 'wave', title: '无损音质', desc: '支持 FLAC 无损，播放条「音质」选超清就能听到。', href: '#/toplist/16' },
  { icon: 'mv', title: '超清 MV', desc: 'MV 最高超清画质，全屏沉浸观看。', href: '#/toplist/158' },
  { icon: 'download', title: '下载保存', desc: '歌曲和 MV 一键保存，文件名带上音质。', href: '#/download' },
  { icon: 'chat', title: '歌词弹幕', desc: '歌词页飘过热评弹幕，和同频的人一起听。', href: '#/community' },
  { icon: 'image', title: '高清封面', desc: '点开封面看大图，喜欢就保存下来。', href: '#/albums' },
  { icon: 'spark', title: '每日推荐', desc: '按你的收藏和最近播放，每天换一份歌单。', href: '#/daily' },
] as const

/** 热搜接口失败时的兜底词。 */
export const FALLBACK_KEYWORDS = ['周杰伦', '晴天', '林俊杰', '陈奕迅', '邓紫棋', '薛之谦', '毛不易', '夜曲']
