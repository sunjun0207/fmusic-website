import { useState } from 'react'
import { NETWORK_TIP } from '../lib/kuwo'
import type { MusicItem } from '../lib/search'
import { toast } from '../lib/toast'
import { usePlayer } from './PlayerProvider'

export const EMPTY_TIP = '这里还没有音乐，去收藏一些喜欢的歌吧'

/** 「播放全部」：先拉歌再整体放进播放列表，按钮上用 busy 显示正在加载的是哪一个。 */
export function usePlayAll() {
  const player = usePlayer()
  const [busy, setBusy] = useState('')

  const start = async (key: string, load: () => Promise<MusicItem[]> | MusicItem[]) => {
    if (busy) return
    setBusy(key)
    try {
      const songs = (await load()).filter((song) => song.id)
      const first = songs[0]
      if (first) player.play(first, 'audio', songs)
      else toast(EMPTY_TIP)
    } catch (reason) {
      toast(reason instanceof Error && reason.message ? reason.message : NETWORK_TIP)
    } finally {
      setBusy('')
    }
  }

  return { busy, start }
}
