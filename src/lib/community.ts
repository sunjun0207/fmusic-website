import { fetchHotComments, type SongComment } from './comment'
import { fetchChartSongs, NETWORK_TIP } from './kuwo'
import type { MusicItem } from './search'

export type WallPost = { song: MusicItem; comment: SongComment }

/** 酷我热评榜上的歌，每首取一到两条高赞热评；同一首歌的两条不挨着放。 */
export async function fetchCommentWall(page = 1, size = 12): Promise<WallPost[]> {
  const chart = await fetchChartSongs('284', page, size)
  const results = await Promise.allSettled(
    chart.songs.map((song) => fetchHotComments(song.id, 6).then((list) => ({ song, list }))),
  )
  const first: WallPost[] = []
  const second: WallPost[] = []
  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    const { song, list } = result.value
    const good = list.filter((comment) => comment.text.length >= 6 && comment.text.length <= 180)
    if (good[0]) first.push({ song, comment: good[0] })
    if (good[1]) second.push({ song, comment: good[1] })
  }
  if (!first.length && results.every((result) => result.status === 'rejected')) throw new Error(NETWORK_TIP)
  return [...first, ...second]
}
