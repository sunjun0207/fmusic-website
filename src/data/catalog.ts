export type Cover = {
  from: string
  to: string
  mark: string
}

export type Track = {
  id: string
  title: string
  artist: string
  artistId: string
  album?: string
  albumId?: string
}

export type Playlist = {
  id: string
  title: string
  desc: string
  tags: string[]
  updated: string
  cover: Cover
  trackIds: string[]
}

export type Chart = {
  id: string
  title: string
  desc: string
  updated: string
  cover: Cover
  trackIds: string[]
}

export type Region = '华语' | '欧美' | '日韩'

export type Artist = {
  id: string
  name: string
  region: Region
  blurb: string
  cover: Cover
}

export type Album = {
  id: string
  title: string
  artist: string
  artistId: string
  year: string
  desc: string
  cover: Cover
  trackIds: string[]
}

export type BannerTone = 'ink' | 'sand' | 'teal'

export type Banner = {
  id: string
  kicker: string
  title: string
  text: string
  action: string
  href: string
  tone: BannerTone
}

export const EDITORIAL_NOTE =
  '榜单、歌单和专辑曲目由编辑整理。不是实时播放统计，也不是完整专辑目录。'

export const PLAYLIST_TAGS = ['全部', '夜晚', '雨天', '通勤', '经典', '轻快', '独处'] as const
export const ARTIST_REGIONS = ['全部', '华语', '欧美', '日韩'] as const
export const hotSearches = ['周杰伦', '夜曲', '林俊杰', '雨', 'Taylor', '消愁', '告五人']

const UPDATED = '2026-10-23'

function t(
  id: string,
  title: string,
  artist: string,
  artistId: string,
  album?: string,
  albumId?: string,
): Track {
  return { id, title, artist, artistId, album, albumId }
}

const tracks: Track[] = [
  t('jay-yequ', '夜曲', '周杰伦', 'jay', '十一月的萧邦'),
  t('jay-qilixiang', '七里香', '周杰伦', 'jay', '七里香'),
  t('jay-qingtian', '晴天', '周杰伦', 'jay', '叶惠美', 'yehuimei'),
  t('jay-daoxiang', '稻香', '周杰伦', 'jay', '魔杰座'),
  t('jay-gaobai', '告白气球', '周杰伦', 'jay', '周杰伦的床边故事'),
  t('jay-qinghuaci', '青花瓷', '周杰伦', 'jay', '我很忙'),
  t('jay-jiandan', '简单爱', '周杰伦', 'jay', '范特西', 'fantasy'),
  t('jay-yifu', '以父之名', '周杰伦', 'jay', '叶惠美', 'yehuimei'),
  t('jay-dongfeng', '东风破', '周杰伦', 'jay', '叶惠美', 'yehuimei'),
  t('jay-anjing', '安静', '周杰伦', 'jay', '范特西', 'fantasy'),
  t('jay-xiyuan', '爱在西元前', '周杰伦', 'jay', '范特西', 'fantasy'),
  t('jay-kaibu', '开不了口', '周杰伦', 'jay', '范特西', 'fantasy'),
  t('jay-shanghai', '上海一九四三', '周杰伦', 'jay', '范特西', 'fantasy'),
  t('jay-shuangjie', '双截棍', '周杰伦', 'jay', '范特西', 'fantasy'),
  t('jay-tingdedao', '你听得到', '周杰伦', 'jay', '叶惠美', 'yehuimei'),
  t('jay-titian', '梯田', '周杰伦', 'jay', '叶惠美', 'yehuimei'),
  t('jay-sannian', '三年二班', '周杰伦', 'jay', '叶惠美', 'yehuimei'),
  t('jj-jiangnan', '江南', '林俊杰', 'jj', '第二天堂', 'second-heaven'),
  t('jj-meiren', '美人鱼', '林俊杰', 'jj', '第二天堂', 'second-heaven'),
  t('jj-89757', '编号89757', '林俊杰', 'jj', '第二天堂', 'second-heaven'),
  t('jj-caocao', '曹操', '林俊杰', 'jj', '第二天堂', 'second-heaven'),
  t('jj-doujiang', '豆浆油条', '林俊杰', 'jj', '第二天堂', 'second-heaven'),
  t('jj-xiulian', '修炼爱情', '林俊杰', 'jj', '因你而在'),
  t('jj-kexi', '可惜没如果', '林俊杰', 'jj', '新地球'),
  t('jj-tashuo', '她说', '林俊杰', 'jj', '她说'),
  t('jj-xiaojiu', '小酒窝', '林俊杰', 'jj', 'JJ陆'),
  t('jj-zuichi', '醉赤壁', '林俊杰', 'jj', 'JJ陆'),
  t('jj-buwei', '不为谁而作的歌', '林俊杰', 'jj'),
  t('eason-shinian', '十年', '陈奕迅', 'eason', '黑白灰'),
  t('eason-fukua', '浮夸', '陈奕迅', 'eason', 'U87'),
  t('eason-fuji', '富士山下', '陈奕迅', 'eason'),
  t('eason-haojiu', '好久不见', '陈奕迅', 'eason'),
  t('eason-kge', 'K歌之王', '陈奕迅', 'eason'),
  t('eason-taotai', '淘汰', '陈奕迅', 'eason', '认了吧', 'renleba'),
  t('eason-hong', '红玫瑰', '陈奕迅', 'eason', '认了吧', 'renleba'),
  t('eason-guyong', '孤勇者', '陈奕迅', 'eason'),
  t('gem-guangnian', '光年之外', '邓紫棋', 'gem'),
  t('gem-paomo', '泡沫', '邓紫棋', 'gem'),
  t('gem-xihuan', '喜欢你', '邓紫棋', 'gem'),
  t('gem-juhao', '句号', '邓紫棋', 'gem'),
  t('gem-duoyuan', '多远都要在一起', '邓紫棋', 'gem', '新的心跳', 'new-heartbeat'),
  t('gem-zaijian', '再见', '邓紫棋', 'gem', '新的心跳', 'new-heartbeat'),
  t('gem-xinduo', '新的心跳', '邓紫棋', 'gem', '新的心跳', 'new-heartbeat'),
  t('mao-xiaochou', '消愁', '毛不易', 'mao', '平凡的一天'),
  t('mao-xiangwo', '像我这样的人', '毛不易', 'mao', '平凡的一天'),
  t('mao-pingfan', '平凡的一天', '毛不易', 'mao', '平凡的一天'),
  t('mao-jie', '借', '毛不易', 'mao'),
  t('yanzi-yujian', '遇见', '孙燕姿', 'yanzi'),
  t('yanzi-tianhei', '天黑黑', '孙燕姿', 'yanzi', '孙燕姿'),
  t('yanzi-kaishi', '开始懂了', '孙燕姿', 'yanzi', 'Stefanie'),
  t('yanzi-huainian', '我怀念的', '孙燕姿', 'yanzi', '逆光'),
  t('kenshi-lemon', 'Lemon', '米津玄师', 'kenshi'),
  t('kenshi-uchiage', '打上花火', '米津玄师', 'kenshi'),
  t('kenshi-uma', '马与鹿', '米津玄师', 'kenshi'),
  t('kenshi-peace', 'Peace Sign', '米津玄师', 'kenshi'),
  t('kenshi-kanden', '感电', '米津玄师', 'kenshi'),
  t('acc-airen', '爱人错过', '告五人', 'acc'),
  t('acc-pixing', '披星戴月的想你', '告五人', 'acc'),
  t('acc-city', '在这座城市遗失了你', '告五人', 'acc'),
  t('acc-magic', '给你一瓶魔法药水', '告五人', 'acc'),
  t('ts-blank', 'Blank Space', 'Taylor Swift', 'taylor', '1989', 't1989'),
  t('ts-style', 'Style', 'Taylor Swift', 'taylor', '1989', 't1989'),
  t('ts-shake', 'Shake It Off', 'Taylor Swift', 'taylor', '1989', 't1989'),
  t('ts-wild', 'Wildest Dreams', 'Taylor Swift', 'taylor', '1989', 't1989'),
  t('ts-bad', 'Bad Blood', 'Taylor Swift', 'taylor', '1989', 't1989'),
  t('ts-clean', 'Clean', 'Taylor Swift', 'taylor', '1989', 't1989'),
  t('ts-woods', 'Out of the Woods', 'Taylor Swift', 'taylor', '1989', 't1989'),
  t('ts-love', 'This Love', 'Taylor Swift', 'taylor', '1989', 't1989'),
  t('ts-anti', 'Anti-Hero', 'Taylor Swift', 'taylor'),
  t('ts-cruel', 'Cruel Summer', 'Taylor Swift', 'taylor'),
  t('ts-story', 'Love Story', 'Taylor Swift', 'taylor'),
  t('ts-cardigan', 'cardigan', 'Taylor Swift', 'taylor'),
  t('liu-houlai', '后来', '刘若英', 'liu'),
  t('nq-rain', '下雨天', '南拳妈妈', 'nanquan'),
  t('chenli-xiaoban', '小半', '陈粒', 'chenli'),
  t('chili-qifeng', '起风了', '买辣椒也用券', 'chili'),
]

const trackMap = new Map(tracks.map((item) => [item.id, item]))

export function getTracks(ids: string[]) {
  return ids.flatMap((id) => {
    const item = trackMap.get(id)
    return item ? [item] : []
  })
}

export function tracksOfArtist(artistId: string) {
  return tracks.filter((item) => item.artistId === artistId)
}

export const banners: Banner[] = [
  {
    id: 'slow',
    kicker: '发现音乐',
    title: '把喜欢的歌，慢慢听完',
    text: '有些歌，只适合在夜色安静下来的时候遇见。先在这里挑一首，再用搜索把它找出来。',
    action: '去看歌单',
    href: '#/playlists',
    tone: 'ink',
  },
  {
    id: 'lyric',
    kicker: '歌词',
    title: '寻一句词，或一个名字',
    text: '搜一个歌名或歌手。输入时会有联想，回车后列出曲目。',
    action: '去搜索',
    href: '#/search',
    tone: 'sand',
  },
  {
    id: 'quality',
    kicker: '音质',
    title: '标准、高品，或无损',
    text: '128K、320K 与 FLAC。想把旋律留在身边，可以在播放器里下载。',
    action: '查看下载',
    href: '#/download',
    tone: 'teal',
  },
]

export const playlists: Playlist[] = [
  {
    id: 'night',
    title: '夜色安静下来',
    desc: '把灯调暗一点。这些歌适合在一天真正结束之后，一首一首听完。',
    tags: ['夜晚', '独处'],
    updated: UPDATED,
    cover: { from: '#0b1f24', to: '#1aa6a0', mark: '夜' },
    trackIds: [
      'jay-yequ',
      'liu-houlai',
      'mao-xiaochou',
      'jay-qilixiang',
      'yanzi-yujian',
      'gem-guangnian',
      'kenshi-lemon',
      'chenli-xiaoban',
    ],
  },
  {
    id: 'rain',
    title: '雨落在窗沿',
    desc: '雨声不必很大。窗边循环这几首，时间会走得慢一些。',
    tags: ['雨天', '夜晚'],
    updated: UPDATED,
    cover: { from: '#1c3d5a', to: '#7eb6c9', mark: '雨' },
    trackIds: [
      'nq-rain',
      'jay-qilixiang',
      'eason-fuji',
      'liu-houlai',
      'gem-paomo',
      'yanzi-yujian',
      'chili-qifeng',
      'jj-jiangnan',
    ],
  },
  {
    id: 'commute',
    title: '通勤的半小时',
    desc: '出门到坐下之间，刚好够听完一小段路程。',
    tags: ['通勤', '轻快'],
    updated: UPDATED,
    cover: { from: '#143238', to: '#3ad1c8', mark: '路' },
    trackIds: [
      'jj-jiangnan',
      'ts-cruel',
      'jay-daoxiang',
      'acc-airen',
      'gem-duoyuan',
      'eason-guyong',
      'ts-shake',
      'jj-xiaojiu',
    ],
  },
  {
    id: 'sun',
    title: '把阳光调低一点',
    desc: '不吵，也不困。适合午后把音量留在刚好能听见歌词的位置。',
    tags: ['轻快'],
    updated: UPDATED,
    cover: { from: '#c9842a', to: '#f3e2b3', mark: '昼' },
    trackIds: [
      'jay-qingtian',
      'jay-daoxiang',
      'ts-style',
      'gem-xihuan',
      'jj-tashuo',
      'yanzi-kaishi',
      'acc-magic',
      'ts-story',
    ],
  },
  {
    id: 'lyric',
    title: '歌词比人先到',
    desc: '先记住一句词，再把整首歌找回来。',
    tags: ['夜晚', '经典'],
    updated: UPDATED,
    cover: { from: '#3d2c4a', to: '#d4a5c3', mark: '词' },
    trackIds: [
      'mao-xiaochou',
      'eason-fukua',
      'jay-qinghuaci',
      'gem-juhao',
      'acc-pixing',
      'mao-xiangwo',
      'eason-hong',
      'chili-qifeng',
    ],
  },
  {
    id: 'classic',
    title: '老歌重新响起来',
    desc: '那些早就熟悉的旋律，再听一次也还站在原来的位置。',
    tags: ['经典'],
    updated: UPDATED,
    cover: { from: '#6b3a2a', to: '#e7c4a8', mark: '旧' },
    trackIds: [
      'eason-shinian',
      'jj-jiangnan',
      'jay-jiandan',
      'yanzi-yujian',
      'yanzi-tianhei',
      'jj-caocao',
      'eason-taotai',
      'jay-qingtian',
    ],
  },
  {
    id: 'room',
    title: '一个人的房间',
    desc: '不需要对话。把歌放着，房间就有了另一端。',
    tags: ['独处', '夜晚'],
    updated: UPDATED,
    cover: { from: '#1a2f33', to: '#8fd0c8', mark: '房' },
    trackIds: [
      'kenshi-lemon',
      'gem-paomo',
      'mao-jie',
      'chenli-xiaoban',
      'eason-haojiu',
      'jay-anjing',
      'acc-city',
      'mao-pingfan',
    ],
  },
  {
    id: 'weekend',
    title: '周末不赶时间',
    desc: '没有闹钟的日子，歌也可以唱得长一点。',
    tags: ['轻快', '通勤'],
    updated: UPDATED,
    cover: { from: '#0e7c78', to: '#d8f3ef', mark: '末' },
    trackIds: [
      'jay-gaobai',
      'ts-blank',
      'jj-xiulian',
      'acc-airen',
      'gem-xinduo',
      'ts-cardigan',
      'eason-kge',
      'jj-zuichi',
    ],
  },
]

export const charts: Chart[] = [
  {
    id: 'night-hot',
    title: '深夜热听',
    desc: '把音量放低，适合一天结束之后。',
    updated: UPDATED,
    cover: { from: '#102a43', to: '#1aa6a0', mark: '深' },
    trackIds: [
      'jay-yequ',
      'liu-houlai',
      'mao-xiaochou',
      'jay-qilixiang',
      'yanzi-yujian',
      'gem-guangnian',
      'kenshi-lemon',
      'gem-paomo',
      'eason-fuji',
      'chenli-xiaoban',
    ],
  },
  {
    id: 'often',
    title: '常搜金曲',
    desc: '大家会反复写进搜索框的歌。',
    updated: UPDATED,
    cover: { from: '#14332e', to: '#8fe3c0', mark: '搜' },
    trackIds: [
      'jay-gaobai',
      'gem-juhao',
      'eason-guyong',
      'ts-anti',
      'ts-cruel',
      'acc-airen',
      'mao-xiangwo',
      'jj-kexi',
      'jj-xiulian',
      'jj-buwei',
    ],
  },
  {
    id: 'classic-echo',
    title: '经典回响',
    desc: '早就会唱的旋律，再听一次也完整。',
    updated: UPDATED,
    cover: { from: '#3e2a22', to: '#e6c2a0', mark: '经典' },
    trackIds: [
      'eason-shinian',
      'jj-jiangnan',
      'jay-jiandan',
      'yanzi-yujian',
      'yanzi-tianhei',
      'jj-caocao',
      'eason-taotai',
      'jay-qingtian',
      'jay-yifu',
      'eason-fukua',
    ],
  },
]

export const artists: Artist[] = [
  {
    id: 'jay',
    name: '周杰伦',
    region: '华语',
    blurb: '从夜曲、七里香听到晴天。',
    cover: { from: '#0b1f24', to: '#1aa6a0', mark: '周' },
  },
  {
    id: 'jj',
    name: '林俊杰',
    region: '华语',
    blurb: '江南、修炼爱情、可惜没如果，都可以直接搜歌手名。',
    cover: { from: '#12343a', to: '#3ad1c8', mark: '林' },
  },
  {
    id: 'eason',
    name: '陈奕迅',
    region: '华语',
    blurb: '十年、浮夸、富士山下，搜「陈奕迅」就能接着听。',
    cover: { from: '#1e3a4c', to: '#9fd3e0', mark: '陈' },
  },
  {
    id: 'gem',
    name: '邓紫棋',
    region: '华语',
    blurb: '光年之外、泡沫、句号，是常被写进搜索框的几首。',
    cover: { from: '#3a1d32', to: '#e7a0c4', mark: '邓' },
  },
  {
    id: 'mao',
    name: '毛不易',
    region: '华语',
    blurb: '消愁和像我这样的人，适合把音量放低一点听。',
    cover: { from: '#2c3330', to: '#c5ddd8', mark: '毛' },
  },
  {
    id: 'yanzi',
    name: '孙燕姿',
    region: '华语',
    blurb: '遇见、天黑黑、我怀念的，搜歌手名就能找到一批。',
    cover: { from: '#24524a', to: '#b7e0c8', mark: '孙' },
  },
  {
    id: 'acc',
    name: '告五人',
    region: '华语',
    blurb: '爱人错过、披星戴月的想你，适合通勤时搜来听。',
    cover: { from: '#2a3a28', to: '#d5e2a8', mark: '告' },
  },
  {
    id: 'liu',
    name: '刘若英',
    region: '华语',
    blurb: '后来这一首，很多歌单都会把它留到夜里。',
    cover: { from: '#3a2a28', to: '#e6c8b0', mark: '刘' },
  },
  {
    id: 'nanquan',
    name: '南拳妈妈',
    region: '华语',
    blurb: '下雨天，雨声一起来就可以搜这首。',
    cover: { from: '#1e3a3a', to: '#9ad7cf', mark: '南' },
  },
  {
    id: 'chenli',
    name: '陈粒',
    region: '华语',
    blurb: '小半很短，适合一个人的房间。',
    cover: { from: '#2e2438', to: '#d5c4ea', mark: '粒' },
  },
  {
    id: 'chili',
    name: '买辣椒也用券',
    region: '华语',
    blurb: '起风了。用歌名就能搜到。',
    cover: { from: '#243028', to: '#c6e2b0', mark: '椒' },
  },
  {
    id: 'kenshi',
    name: '米津玄师',
    region: '日韩',
    blurb: 'Lemon、打上花火、马与鹿，用歌手名或歌名都能搜。',
    cover: { from: '#1c1c28', to: '#d0d4ea', mark: '米' },
  },
  {
    id: 'taylor',
    name: 'Taylor Swift',
    region: '欧美',
    blurb: '从 Love Story、Blank Space 到 Anti-Hero，直接搜英文歌名。',
    cover: { from: '#4a2c3a', to: '#f0c2cf', mark: 'T' },
  },
]

export const albums: Album[] = [
  {
    id: 'yehuimei',
    title: '叶惠美',
    artist: '周杰伦',
    artistId: 'jay',
    year: '2003',
    desc: '2003 年的专辑。下面是编辑挑出来方便搜索的曲目，不是完整目录。',
    cover: { from: '#10242a', to: '#7dcec6', mark: '叶' },
    trackIds: ['jay-yifu', 'jay-qingtian', 'jay-dongfeng', 'jay-tingdedao', 'jay-titian', 'jay-sannian'],
  },
  {
    id: 'fantasy',
    title: '范特西',
    artist: '周杰伦',
    artistId: 'jay',
    year: '2001',
    desc: '2001 年的专辑。这里只列出方便按歌名搜索的几首。',
    cover: { from: '#243044', to: '#d7c4a2', mark: '范' },
    trackIds: ['jay-xiyuan', 'jay-jiandan', 'jay-kaibu', 'jay-shanghai', 'jay-anjing', 'jay-shuangjie'],
  },
  {
    id: 'second-heaven',
    title: '第二天堂',
    artist: '林俊杰',
    artistId: 'jj',
    year: '2004',
    desc: '2004 年的专辑。江南、曹操都在这张里。',
    cover: { from: '#12383a', to: '#9ad4ea', mark: '二' },
    trackIds: ['jj-jiangnan', 'jj-meiren', 'jj-89757', 'jj-caocao', 'jj-doujiang'],
  },
  {
    id: 'renleba',
    title: '认了吧',
    artist: '陈奕迅',
    artistId: 'eason',
    year: '2007',
    desc: '2007 年的专辑。这里列出最常被搜到的两首，不是完整目录。',
    cover: { from: '#3a2428', to: '#e7b7b0', mark: '认' },
    trackIds: ['eason-taotai', 'eason-hong'],
  },
  {
    id: 'new-heartbeat',
    title: '新的心跳',
    artist: '邓紫棋',
    artistId: 'gem',
    year: '2015',
    desc: '2015 年的专辑。下面是编辑挑出来方便查找的曲目，不是完整目录。',
    cover: { from: '#3a1d38', to: '#f0b4c8', mark: '新' },
    trackIds: ['gem-duoyuan', 'gem-zaijian', 'gem-xinduo'],
  },
  {
    id: 't1989',
    title: '1989',
    artist: 'Taylor Swift',
    artistId: 'taylor',
    year: '2014',
    desc: '2014 年的专辑。英文歌名可以直接拿去搜索。',
    cover: { from: '#1d4e63', to: '#9fd4ea', mark: '89' },
    trackIds: ['ts-blank', 'ts-style', 'ts-shake', 'ts-wild', 'ts-bad', 'ts-woods', 'ts-love', 'ts-clean'],
  },
]

export function getPlaylist(id: string) {
  return playlists.find((item) => item.id === id)
}

export function getChart(id: string) {
  return charts.find((item) => item.id === id)
}

export function getArtist(id: string) {
  return artists.find((item) => item.id === id)
}

export function getAlbum(id: string) {
  return albums.find((item) => item.id === id)
}

function includes(text: string, q: string) {
  return text.toLowerCase().includes(q)
}

export function searchCatalog(raw: string) {
  const q = raw.trim().toLowerCase()
  if (!q) {
    return {
      tracks: [] as Track[],
      playlists: [] as Playlist[],
      artists: [] as Artist[],
      albums: [] as Album[],
    }
  }
  return {
    tracks: tracks.filter(
      (item) => includes(item.title, q) || includes(item.artist, q) || includes(item.album ?? '', q),
    ),
    playlists: playlists.filter((item) => {
      if (includes(item.title, q) || includes(item.desc, q) || item.tags.some((tag) => includes(tag, q))) {
        return true
      }
      return getTracks(item.trackIds).some((song) => includes(song.title, q) || includes(song.artist, q))
    }),
    artists: artists.filter((item) => {
      if (includes(item.name, q) || includes(item.blurb, q) || includes(item.region, q)) return true
      return tracks.some(
        (song) => song.artistId === item.id && (includes(song.title, q) || includes(song.album ?? '', q)),
      )
    }),
    albums: albums.filter((item) => {
      if (includes(item.title, q) || includes(item.artist, q) || includes(item.desc, q)) return true
      return getTracks(item.trackIds).some((song) => includes(song.title, q))
    }),
  }
}
