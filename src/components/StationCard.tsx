import { useState, type CSSProperties } from 'react'
import type { Station } from '../data/brand'
import { NETWORK_TIP } from '../lib/kuwo'
import { setTuned, tagSongs, useTuned } from '../lib/radio'
import type { MusicItem } from '../lib/search'
import { toast } from '../lib/toast'
import { WaveArt } from './PageHero'
import { usePlayer } from './PlayerProvider'
import { EMPTY_TIP } from './usePlayAll'

/** 调频：拉一批歌放进播放列表，并记住正在收听哪个电台。 */
export function useTuner() {
  const player = usePlayer()
  const tuned = useTuned()
  const [busy, setBusy] = useState('')
  const onAir = tuned.ids.includes(player.playingId) ? tuned.id : ''

  const tune = async (id: string, name: string, load: () => Promise<MusicItem[]>) => {
    if (busy) return
    setBusy(id)
    try {
      const songs = await load()
      const first = songs[0]
      if (!first) {
        toast(EMPTY_TIP)
        return
      }
      player.play(first, 'audio', songs)
      setTuned(id, songs)
      toast(`已调频到「${name}」，${songs.length} 首歌陪你`)
    } catch (reason) {
      toast(reason instanceof Error && reason.message ? reason.message : NETWORK_TIP)
    } finally {
      setBusy('')
    }
  }

  const tuneStation = (station: Station) => tune(station.id, station.name, () => tagSongs(station.tagId))

  return { busy, onAir, tune, tuneStation }
}

export function toneStyle(tone: [string, string]) {
  return { '--tone-a': tone[0], '--tone-b': tone[1] } as CSSProperties
}

type Props = {
  station: Station
  live?: boolean
  onAir: boolean
  busy: boolean
  onTune: () => void
}

export function StationCard({ station, live = false, onAir, busy, onTune }: Props) {
  return (
    <article className={`station-card${onAir ? ' is-on-air' : ''}`} style={toneStyle(station.tone)}>
      <div className="station-top">
        <span className="station-en">{station.en}</span>
        {onAir ? <span className="live-badge">收听中</span> : live ? <span className="live-badge is-soft">此刻推荐</span> : null}
      </div>
      <h3>{station.name}</h3>
      <p>{station.slogan}</p>
      <button type="button" className="station-play" disabled={busy} onClick={onTune}>
        {busy ? '正在调频…' : onAir ? '换一批' : '开始收听'}
      </button>
      <WaveArt className="station-wave" />
    </article>
  )
}
