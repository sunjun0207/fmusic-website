import { useMemo, useSyncExternalStore } from 'react'
import { getFavorites, onLibraryChange } from './library'

let version = 0
onLibraryChange(() => {
  version += 1
})

/** 本地收藏、歌单、最近播放的版本号，变了就重新读 localStorage。 */
export function useLibraryVersion() {
  return useSyncExternalStore(onLibraryChange, () => version)
}

export function useFavoriteIds() {
  const current = useLibraryVersion()
  return useMemo(() => {
    void current
    return new Set(getFavorites().map((song) => song.id))
  }, [current])
}
