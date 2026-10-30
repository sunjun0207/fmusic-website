import { createContext, useContext, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { PlayQueue } from './PlayQueue'
import { CommentPanel } from './CommentPanel'
import { DanmakuLayer } from './DanmakuLayer'
import { Icon } from './Icon'
import { LyricView } from './LyricView'
import { openPlaylistPicker } from './PlaylistPicker'
import { fetchComments, fetchDanmaku, formatCommentCount, type SongComment } from '../lib/comment'
import {
  addRecentPlay,
  clearFavorites,
  getDanmakuEnabled,
  getMvBrightness,
  getMvQuality,
  getMvVolume,
  getPlayMode,
  getSongBrightness,
  getSongVolume,
  getPosterQuality,
  getRecentPlays,
  getSongQuality,
  isFavorite,
  removeFavorite,
  saveDanmakuEnabled,
  saveMvBrightness,
  saveMvQuality,
  saveMvVolume,
  savePlayMode,
  saveSongBrightness,
  saveSongQuality,
  saveSongVolume,
  savePosterQuality,
  toggleFavorite,
  type PictureQuality,
} from '../lib/library'
import { getLyric, prefetchLyric, type LyricLine } from '../lib/lyric'
import { nextPlayMode, PLAY_MODE_LABEL, resolveAdvance, type AdvanceDirection, type PlayMode } from '../lib/playback'
import { mediaFilename, pictureFilename, saveMedia, savePicture } from '../lib/saveMedia'
import { getMediaUrl, getPlayableMvQualities, listedMvQualities, playedAudioProfile, prefetchMedia, sameMediaFile } from '../lib/play'
import { coverUrl, findPlayable, isSongWithoutMv, POSTER_SIZE, rememberNoMv, songPosters, subscribeNoMv, withCoverSize, type MusicItem } from '../lib/search'
import { shareSong } from '../lib/share'
import { toast } from '../lib/toast'

/** 歌曲地址拿不到、音频加载出错时统一的说法；MV 仍然用具体原因（比如没有 MV）。 */
const PLAY_TIP = '音乐暂时走神了，请稍后再试'

const MODE_ICON = { list: 'repeat', single: 'repeatOne', shuffle: 'shuffle' } as const

type Kind = 'audio' | 'mv'
type Loaded = { song: MusicItem; url: string }
type CoverView = { urls: string[]; index: number; title: string; artist: string }

type PlayerApi = {
  play: (song: MusicItem, kind: Kind, queue?: MusicItem[]) => void
  playNamed: (title: string, artist: string, kind: Kind) => void
  warm: (song: MusicItem, kind?: Kind) => void
  warmNamed: (title: string, artist: string, kind?: Kind) => void
  toggleFavorite: (song: MusicItem) => void
  removeFavorite: (id: string) => void
  clearFavorites: () => void
  pending: boolean
  error: string
  playingId: string
  libraryVersion: number
  dismissLyric: () => void
}

const PlayerContext = createContext<PlayerApi | null>(null)

function StageIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

function CommentIcon() {
  return (
    <StageIcon>
      <path d="M6 7h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H11l-3.5 3v-3H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
    </StageIcon>
  )
}
function DownloadIcon() {
  return (
    <StageIcon>
      <path d="M12 4v11" />
      <path d="M8 11l4 4 4-4" />
      <path d="M5 20h14" />
    </StageIcon>
  )
}

function QualityIcon() {
  return (
    <StageIcon>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
      <circle cx="8" cy="7" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="11" cy="17" r="1.6" fill="currentColor" stroke="none" />
    </StageIcon>
  )
}

function FullscreenIcon() {
  return (
    <StageIcon>
      <path d="M8 4H4v4" />
      <path d="M16 4h4v4" />
      <path d="M20 16v4h-4" />
      <path d="M4 16v4h4" />
    </StageIcon>
  )
}

function ExitFullscreenIcon() {
  return (
    <StageIcon>
      <path d="M4 9h5V4" />
      <path d="M20 9h-5V4" />
      <path d="M20 15h-5v5" />
      <path d="M4 15h5v5" />
    </StageIcon>
  )
}

function CloseIcon() {
  return (
    <StageIcon>
      <path d="M7 7l10 10" />
      <path d="M17 7L7 17" />
    </StageIcon>
  )
}

function PlayPauseIcon({ paused }: { paused: boolean }) {
  if (paused) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8 5.5v13l11-6.5-11-6.5Z" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

const QUALITY_OPTIONS: { id: PictureQuality; label: string }[] = [
  { id: 'sd', label: '标清' },
  { id: 'hd', label: '高清' },
  { id: 'fhd', label: '超清' },
]

function nearestQuality(current: PictureQuality, choices: PictureQuality[]) {
  const order: PictureQuality[] = ['sd', 'hd', 'fhd']
  const index = order.indexOf(current)
  return [...choices].sort((left, right) => {
    const leftDistance = order.indexOf(left) <= index ? index - order.indexOf(left) : 10 + order.indexOf(left)
    const rightDistance = order.indexOf(right) <= index ? index - order.indexOf(right) : 10 + order.indexOf(right)
    return leftDistance - rightDistance
  })[0] ?? current
}

function QualitySwitch({
  label,
  value,
  onChange,
  toolbar = false,
  light = false,
  disabledValues = [],
}: {
  label: string
  value: PictureQuality
  onChange: (value: PictureQuality) => void
  toolbar?: boolean
  light?: boolean
  disabledValues?: PictureQuality[]
}) {
  const className = [toolbar ? 'stage-tool quality-switch' : 'quality-switch', light ? 'is-light' : ''].filter(Boolean).join(' ')
  return (
    <label className={className}>
      {toolbar ? <QualityIcon /> : <span>{label}</span>}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => {
          const next = event.target.value as PictureQuality
          if (disabledValues.includes(next)) return
          onChange(next)
        }}
      >
        {QUALITY_OPTIONS.map((item) => {
          const disabled = disabledValues.includes(item.id)
          return (
            <option key={item.id} value={item.id} disabled={disabled}>
              {disabled ? `${item.label}（无）` : item.label}
            </option>
          )
        })}
      </select>
    </label>
  )
}

function DanmakuSwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`danmaku-switch${on ? ' is-on' : ''}`}
      role="switch"
      aria-checked={on}
      aria-label={on ? '关闭弹幕' : '打开弹幕'}
      onClick={onClick}
    >
      <span>弹幕</span>
      <i />
    </button>
  )
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 10v4h3l4 3V7L7 10H4z" fill="currentColor" stroke="none" />
      {muted ? (
        <path d="M16 10l4 4M20 10l-4 4" strokeLinecap="round" />
      ) : (
        <>
          <path d="M16 9.5a3.5 3.5 0 0 1 0 5" strokeLinecap="round" />
          <path d="M18.5 7.5a6.5 6.5 0 0 1 0 9" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

function BrightnessIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" strokeLinecap="round" />
    </svg>
  )
}

function DragMeter({
  label,
  value,
  min,
  max,
  icon,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  icon: ReactNode
  onChange: (value: number) => void
}) {
  const ratio = max > min ? ((value - min) / (max - min)) * 100 : 0
  return (
    <label className="drag-meter">
      {icon}
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        style={{ ['--meter' as string]: `${ratio}%` }}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function clock(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const min = Math.floor(sec / 60)
  const rest = Math.floor(sec % 60)
  return `${min}:${String(rest).padStart(2, '0')}`
}

function SeekBar({
  current,
  duration,
  onScrub,
  onScrubEnd,
}: {
  current: number
  duration: number
  onScrub: (value: number) => void
  onScrubEnd: (value: number) => void
}) {
  return (
    <input
      className="seek"
      type="range"
      min={0}
      max={duration || 0}
      step={0.1}
      value={Math.min(current, duration || 0)}
      aria-label="播放进度"
      onPointerDown={() => onScrub(current)}
      onChange={(event) => onScrub(Number(event.target.value))}
      onPointerUp={(event) => onScrubEnd(Number(event.currentTarget.value))}
      onKeyUp={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
          onScrubEnd(Number(event.currentTarget.value))
        }
      }}
    />
  )
}

export function usePlayer() {
  const value = useContext(PlayerContext)
  if (!value) throw new Error('usePlayer 需要放在 PlayerProvider 里')
  return value
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [audio, setAudio] = useState<Loaded | null>(null)
  const [mv, setMv] = useState<Loaded | null>(null)
  const [stage, setStage] = useState<Kind | null>(null)
  const [pending, setPending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [playingId, setPlayingId] = useState('')
  const [paused, setPaused] = useState(true)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [stageClean, setStageClean] = useState(false)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [lyricStatus, setLyricStatus] = useState<'loading' | 'ready' | 'empty'>('empty')
  const [lyricOpen, setLyricOpen] = useState(false)
  const [posterIndex, setPosterIndex] = useState(0)
  const [posterHold, setPosterHold] = useState(0)
  const [posterDragging, setPosterDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [brokenPosters, setBrokenPosters] = useState<string[]>([])
  const [posterQuality, setPosterQuality] = useState<PictureQuality>(getPosterQuality)
  const [audioQuality, setAudioQuality] = useState<PictureQuality>(getSongQuality)
  const [mvQuality, setMvQuality] = useState<PictureQuality>(getMvQuality)
  const [coverView, setCoverView] = useState<CoverView | null>(null)
  const [coverSaving, setCoverSaving] = useState(false)
  const [coverNote, setCoverNote] = useState('')
  const [mvQualityOptions, setMvQualityOptions] = useState<PictureQuality[] | null>(null)
  const [songVolume, setSongVolume] = useState(getSongVolume)
  const [songBrightness, setSongBrightness] = useState(getSongBrightness)
  const [mvVolume, setMvVolume] = useState(getMvVolume)
  const [mvBrightness, setMvBrightness] = useState(getMvBrightness)
  const songVolumeRef = useRef(songVolume)
  const mvVolumeRef = useRef(mvVolume)
  songVolumeRef.current = songVolume
  mvVolumeRef.current = mvVolume
  const [danmakuOn, setDanmakuOn] = useState(getDanmakuEnabled)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentTotal, setCommentTotal] = useState<number | null>(null)
  const [pictureTop, setPictureTop] = useState(12)
  const [bullets, setBullets] = useState<SongComment[]>([])
  const [queued, setQueued] = useState<MusicItem | null>(null)
  const [queue, setQueue] = useState<MusicItem[]>([])
  const [playMode, setPlayMode] = useState<PlayMode>(() => getPlayMode())
  const [libraryVersion, setLibraryVersion] = useState(0)
  const [queueOpen, setQueueOpen] = useState(false)
  const [favOn, setFavOn] = useState(false)
  const [songHeld, setSongHeld] = useState(false)
  const [noMvTick, setNoMvTick] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const silenceAudioRef = useRef(false)
  const audioTimeRef = useRef(0)
  const stageRef = useRef<HTMLDivElement>(null)
  const chromeTimer = useRef(0)
  const stackRef = useRef<HTMLDivElement>(null)
  const scrubbingRef = useRef(false)
  const requestRef = useRef(0)
  const queueRef = useRef<MusicItem[]>([])
  const modeRef = useRef<PlayMode>(playMode)
  const historyRef = useRef<string[]>([])
  const audioSongRef = useRef<MusicItem | null>(null)
  const showLyricRef = useRef(true)
  const mvQualityRef = useRef(mvQuality)
  const audioQualityRef = useRef(audioQuality)
  const videoTimeRef = useRef(0)
  const posterDragRef = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null)
  mvQualityRef.current = mvQuality
  audioQualityRef.current = audioQuality
  queueRef.current = queue
  modeRef.current = playMode
  audioSongRef.current = audio?.song ?? null

  const activeKind: Kind = stage === 'mv' || (!audio && mv) ? 'mv' : 'audio'
  const active = activeKind === 'mv' ? mv : audio
  const mediaRef = activeKind === 'mv' ? videoRef : audioRef
  const dockSong = active?.song ?? queued

  useEffect(() => {
    document.body.classList.toggle('has-player', Boolean(audio || mv || queued))
    document.body.classList.toggle('lyric-open', lyricOpen && stage !== 'mv')
    return () => {
      document.body.classList.remove('has-player')
      document.body.classList.remove('lyric-open')
    }
  }, [audio, mv, queued, lyricOpen, stage])

  useEffect(() => {
    if (!lyricOpen) return
    const apply = () => {
      const top = document.querySelector('.sticky-top')?.getBoundingClientRect().height ?? 112
      const dock = stackRef.current?.offsetHeight ?? 84
      document.documentElement.style.setProperty('--lyric-top', `${top}px`)
      document.documentElement.style.setProperty('--lyric-bottom', `${dock}px`)
    }
    apply()
    const observer = new ResizeObserver(apply)
    const topNode = document.querySelector('.sticky-top')
    if (topNode) observer.observe(topNode)
    if (stackRef.current) observer.observe(stackRef.current)
    return () => observer.disconnect()
  }, [lyricOpen, audio, mv, pending, queued])

  useEffect(() => {
    if (stage !== 'mv') return
    const video = videoRef.current
    if (!video) return
    const measure = () => {
      const node = videoRef.current
      if (!node) return
      const { videoWidth, videoHeight, clientWidth, clientHeight } = node
      if (!videoWidth || !videoHeight || !clientHeight) {
        setPictureTop(stageClean ? 12 : fullscreen ? 72 : 12)
        return
      }
      const scale = Math.min(clientWidth / videoWidth, clientHeight / videoHeight)
      const letterbox = Math.max(0, (clientHeight - videoHeight * scale) / 2)
      const offset = node.offsetTop
      const chrome = fullscreen && !stageClean ? 64 : 0
      setPictureTop(Math.round(Math.max(offset + letterbox + 10, chrome + 8)))
    }
    measure()
    video.addEventListener('loadedmetadata', measure)
    const observer = new ResizeObserver(measure)
    observer.observe(video)
    if (video.parentElement) observer.observe(video.parentElement)
    window.addEventListener('resize', measure)
    return () => {
      video.removeEventListener('loadedmetadata', measure)
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [stage, mv?.url, fullscreen, stageClean])

  const lyricSong = audio?.song.id ? audio.song : queued
  const lyricId = lyricSong?.id ?? ''
  const talkId = stage === 'mv' && mv?.song.id ? mv.song.id : lyricOpen && lyricSong?.id ? lyricSong.id : ''

  useEffect(() => {
    if (!danmakuOn || !talkId) {
      setBullets([])
      return
    }
    let cancel = false
    setBullets([])
    fetchDanmaku(talkId)
      .then((list) => {
        if (!cancel) setBullets(list)
      })
      .catch(() => {
        if (!cancel) setBullets([])
      })
    return () => {
      cancel = true
    }
  }, [danmakuOn, talkId])

  useEffect(() => {
    const id = lyricOpen && stage !== 'mv' ? lyricSong?.id ?? '' : ''
    if (!id) {
      setCommentTotal(null)
      return
    }
    let cancel = false
    setCommentTotal(null)
    fetchComments(id, 1, 1)
      .then((result) => {
        if (!cancel) setCommentTotal(result.total)
      })
      .catch(() => {
        if (!cancel) setCommentTotal(null)
      })
    return () => {
      cancel = true
    }
  }, [lyricOpen, stage, lyricSong?.id])

  const toggleDanmaku = () => {
    setDanmakuOn((value) => {
      const next = !value
      saveDanmakuEnabled(next)
      return next
    })
  }

  const danmaku = danmakuOn && bullets.length ? (
    <DanmakuLayer
      items={bullets}
      current={current}
      duration={duration}
      paused={paused}
      insetTop={stage === 'mv' ? pictureTop : 0}
    />
  ) : null
  const hidePoster = (url: string) => {
    setBrokenPosters((list) => (list.includes(url) ? list : [...list, url]))
  }
  const posterSize = POSTER_SIZE[posterQuality]
  const dockPosters = useMemo(
    () => songPosters(dockSong, posterSize).filter((url) => !brokenPosters.includes(url)),
    [dockSong, brokenPosters, posterSize],
  )
  const posters = useMemo(
    () => songPosters(lyricSong, posterSize).filter((url) => !brokenPosters.includes(url)),
    [lyricSong, brokenPosters, posterSize],
  )
  const posterToken = `${dockSong?.id ?? ''}|${lyricSong?.id ?? ''}|${dockPosters.join('|')}|${posters.join('|')}`
  const posterCount = Math.max(dockPosters.length, posters.length)
  const posterAt = posters.length ? posterIndex % posters.length : 0
  const dockAt = dockPosters.length ? posterIndex % dockPosters.length : 0

  const setLyricVisible = (open: boolean) => {
    showLyricRef.current = open
    setLyricOpen(open)
  }

  const dismissLyric = () => {
    showLyricRef.current = false
    setLyricOpen(false)
  }

  const slidePoster = (dir: number) => {
    if (posterCount < 2) return
    setPosterIndex((value) => (value + dir + posterCount) % posterCount)
    setPosterHold((value) => value + 1)
    setDragX(0)
  }

  const openCover = (song?: MusicItem | null, currentUrl = '') => {
    if (!song) return
    const urls = songPosters(song, POSTER_SIZE.fhd)
    if (!urls.length) return
    const target = currentUrl ? withCoverSize(currentUrl, POSTER_SIZE.fhd) : urls[0]
    const found = target ? urls.indexOf(target) : 0
    setCoverNote('')
    setCoverView({
      urls,
      index: found >= 0 ? found : 0,
      title: song.title,
      artist: song.artist,
    })
  }

  const slideCover = (dir: number) => {
    setCoverNote('')
    setCoverView((view) => {
      if (!view || view.urls.length < 2) return view
      return { ...view, index: (view.index + dir + view.urls.length) % view.urls.length }
    })
  }

  const onPosterDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    posterDragRef.current = { x: event.clientX, y: event.clientY, dx: 0, dy: 0 }
    if (posterCount < 2) return
    setPosterDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPosterMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = posterDragRef.current
    if (!drag) return
    drag.dx = event.clientX - drag.x
    drag.dy = event.clientY - drag.y
    if (posterDragging || posterCount >= 2) setDragX(drag.dx)
  }

  const onPosterUp = () => {
    const drag = posterDragRef.current
    posterDragRef.current = null
    setPosterDragging(false)
    if (!drag) return
    if (drag.dx <= -48) slidePoster(1)
    else if (drag.dx >= 48) slidePoster(-1)
    else setDragX(0)
    if (Math.abs(drag.dx) < 48 && Math.abs(drag.dy) < 48) openCover(lyricSong, posters[posterAt])
  }

  const onPosterCancel = () => {
    posterDragRef.current = null
    setPosterDragging(false)
    setDragX(0)
  }

  useEffect(() => {
    setPosterIndex(0)
  }, [posterToken])

  useEffect(() => {
    if (!coverView) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCoverView(null)
        return
      }
      if (coverView.urls.length < 2) return
      if (event.key === 'ArrowRight') slideCover(1)
      if (event.key === 'ArrowLeft') slideCover(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [coverView])

  useEffect(() => {
    if (paused || posterCount < 2) return
    const timer = window.setInterval(() => {
      setPosterIndex((value) => (value + 1) % posterCount)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [paused, posterToken, posterCount, posterHold])

  useEffect(() => {
    if (!lyricId) {
      setLyrics([])
      setLyricStatus(lyricOpen ? 'loading' : 'empty')
      return
    }
    let cancel = false
    setLyricStatus('loading')
    getLyric(lyricId)
      .then((lines) => {
        if (cancel) return
        setLyrics(lines)
        setLyricStatus(lines.length ? 'ready' : 'empty')
      })
      .catch(() => {
        if (cancel) return
        setLyrics([])
        setLyricStatus('empty')
      })
    return () => {
      cancel = true
    }
  }, [lyricId, lyricOpen])

  useEffect(() => {
    const node = stackRef.current
    if (!node) {
      document.body.style.paddingBottom = ''
      return
    }
    const apply = () => {
      document.body.style.paddingBottom = `${node.offsetHeight + 16}px`
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(node)
    return () => {
      observer.disconnect()
      document.body.style.paddingBottom = ''
    }
  }, [audio, mv, queued])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const blockSong = () => {
      if (!silenceAudioRef.current) return
      el.pause()
      el.muted = true
      el.volume = 0
    }
    el.addEventListener('play', blockSong)
    el.addEventListener('playing', blockSong)
    return () => {
      el.removeEventListener('play', blockSong)
      el.removeEventListener('playing', blockSong)
    }
  }, [audio])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const hold = songHeld || silenceAudioRef.current || activeKind !== 'audio' || !audio?.url
    if (hold) {
      if (el.currentTime > 0) audioTimeRef.current = el.currentTime || audioTimeRef.current
      el.pause()
      el.muted = true
      el.volume = 0
      if (el.getAttribute('src')) {
        el.removeAttribute('src')
        el.load()
      }
      return
    }
    el.muted = false
    el.volume = songVolumeRef.current / 100
    if (el.getAttribute('src') !== audio.url) el.src = audio.url
    let cancel = false
    void el.play().then(() => {
      if (cancel || silenceAudioRef.current) {
        el.pause()
        el.muted = true
        el.volume = 0
      }
    }).catch(() => undefined)
    return () => {
      cancel = true
      el.pause()
    }
  }, [audio, activeKind, songHeld])

  useEffect(() => {
    if (stage !== 'mv') return
    const stopSong = () => {
      const el = audioRef.current
      if (!el || !silenceAudioRef.current) return
      el.pause()
      el.muted = true
      el.volume = 0
      if (el.getAttribute('src')) {
        if (el.currentTime > 0) audioTimeRef.current = el.currentTime
        el.removeAttribute('src')
        el.load()
      }
    }
    stopSong()
    const timer = window.setInterval(stopSong, 300)
    return () => window.clearInterval(timer)
  }, [stage])

  useEffect(() => {
    if (stage !== 'mv' || !mv?.url) return
    silenceAudioRef.current = true
    setSongHeld(true)
    const video = videoRef.current
    let cancel = false
    void video?.play().then(() => {
      if (cancel) video.pause()
    }).catch(() => undefined)
    return () => {
      cancel = true
      video?.pause()
    }
  }, [stage, mv])

  useEffect(() => {
    if (stage !== 'mv') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement) {
        videoRef.current?.pause()
        silenceAudioRef.current = false
        setSongHeld(false)
        setStage(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage])

  useEffect(() => subscribeNoMv(() => setNoMvTick((value) => value + 1)), [])

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  useEffect(() => {
    setStageClean(false)
  }, [stage, fullscreen])

  const armChromeHide = () => {
    window.clearTimeout(chromeTimer.current)
    chromeTimer.current = window.setTimeout(() => setStageClean(true), 3000)
  }

  useEffect(() => {
    if (stage !== 'mv' || stageClean) {
      window.clearTimeout(chromeTimer.current)
      return
    }
    armChromeHide()
    return () => window.clearTimeout(chromeTimer.current)
  }, [stage, stageClean, fullscreen])

  const bind = (el: HTMLMediaElement | null) => {
    if (!el) return
    setPaused((value) => (value === el.paused ? value : el.paused))
    if (!scrubbingRef.current) {
      const time = el.currentTime || 0
      setCurrent((value) => (Math.abs(value - time) < 0.12 ? value : time))
    }
    const nextDuration = Number.isFinite(el.duration) ? el.duration : 0
    setDuration((value) => (Math.abs(value - nextDuration) < 0.1 ? value : nextDuration))
  }

  const silenceSong = () => {
    silenceAudioRef.current = true
    const el = audioRef.current
    if (el) {
      if (el.currentTime > 0) audioTimeRef.current = el.currentTime
      el.pause()
      el.muted = true
      el.volume = 0
      el.removeAttribute('src')
      el.load()
    }
    setSongHeld(true)
  }

  const releaseSong = () => {
    silenceAudioRef.current = false
    setSongHeld(false)
  }

  const open = async (song: MusicItem, kind: Kind, request?: number) => {
    const ticket = request ?? ++requestRef.current
    if (kind === 'audio' && audio?.song.id === song.id && audio.url) {
      const el = audioRef.current
      releaseSong()
      videoRef.current?.pause()
      setMv(null)
      setStage(null)
      setQueued(song)
      setLyricOpen(showLyricRef.current)
      setPlayingId(song.id)
      setPending(false)
      if (!el) return
      if (el.paused) void el.play().catch(() => undefined)
      else el.pause()
      return
    }
    if (kind === 'mv' && mv?.song.id === song.id && mv.url) {
      silenceSong()
      setStage('mv')
      setPlayingId(song.id)
      setPending(false)
      const el = videoRef.current
      if (el?.paused) void el.play().catch(() => undefined)
      return
    }
    if (kind === 'mv' && (!song.hasMv || isSongWithoutMv(song.id))) {
      releaseSong()
      setError('这首歌暂时没有 MV')
      setPending(false)
      return
    }
    if (kind === 'mv') silenceSong()
    else videoRef.current?.pause()
    setError('')
    setPending(true)
    setPlayingId(song.id)
    setCurrent(0)
    setDuration(0)
    if (kind === 'audio') {
      setQueued(song)
      setLyricOpen(showLyricRef.current)
      setMv(null)
      setStage(null)
      if (song.id) {
        addRecentPlay(song)
        setLibraryVersion((value) => value + 1)
        prefetchLyric(song.id)
      }
    }
    try {
      const url = await getMediaUrl(song.id, kind, kind === 'mv' ? mvQualityRef.current : audioQualityRef.current, song.mvId ?? '')
      if (ticket !== requestRef.current) return
      if (kind === 'audio') {
        audioTimeRef.current = 0
        releaseSong()
        videoRef.current?.pause()
        setMv(null)
        setStage(null)
        setAudio({ song, url })
      } else {
        silenceSong()
        setMv({ song, url })
        setStage('mv')
      }
    } catch (reason: unknown) {
      if (ticket !== requestRef.current) return
      if (kind === 'mv') releaseSong()
      const message = reason instanceof Error ? reason.message : PLAY_TIP
      if (kind === 'mv' && message.includes('没有')) rememberNoMv(song.id)
      setError(kind === 'mv' ? message : PLAY_TIP)
    } finally {
      if (ticket === requestRef.current) setPending(false)
    }
  }

  const rememberQueue = (song: MusicItem, nextQueue?: MusicItem[], keepHistory = false) => {
    if (!song.id) return
    if (nextQueue?.length) {
      const list = nextQueue.some((item) => item.id === song.id) ? nextQueue : [song, ...nextQueue]
      queueRef.current = list
      setQueue(list)
      historyRef.current = []
      return
    }
    const current = audioSongRef.current
    if (!keepHistory && modeRef.current === 'shuffle' && current && current.id !== song.id) {
      historyRef.current = [...historyRef.current, current.id].slice(-50)
    }
    if (!queueRef.current.some((item) => item.id === song.id)) {
      queueRef.current = [song]
      setQueue([song])
      historyRef.current = []
    }
  }

  const play = (song: MusicItem, kind: Kind, nextQueue?: MusicItem[], keepHistory = false) => {
    if (kind === 'audio') rememberQueue(song, nextQueue, keepHistory)
    void open(song, kind)
  }

  const advance = (direction: AdvanceDirection) => {
    const song = audioSongRef.current
    if (!song?.id) return
    if (silenceAudioRef.current && direction !== 'ended') {
      releaseSong()
      videoRef.current?.pause()
      setMv(null)
      setStage(null)
    }
    if (silenceAudioRef.current) return
    const result = resolveAdvance({
      list: queueRef.current,
      currentId: song.id,
      mode: modeRef.current,
      direction,
      history: historyRef.current,
    })
    historyRef.current = result.history
    if (result.replay || !result.item || result.item.id === song.id) {
      const el = audioRef.current
      if (!el) return
      el.currentTime = 0
      void el.play().catch(() => undefined)
      return
    }
    play(result.item, 'audio', undefined, true)
  }

  const cycleMode = () => {
    setPlayMode((mode) => {
      const next = nextPlayMode(mode)
      savePlayMode(next)
      if (next !== 'shuffle') historyRef.current = []
      return next
    })
  }

  const toggleSongFavorite = (song: MusicItem) => {
    if (!song.id) return
    toggleFavorite(song)
    setLibraryVersion((value) => value + 1)
  }

  const removeSongFavorite = (id: string) => {
    removeFavorite(id)
    setLibraryVersion((value) => value + 1)
  }

  const clearSongFavorites = () => {
    clearFavorites()
    setLibraryVersion((value) => value + 1)
  }

  const playNamed = (title: string, artist: string, kind: Kind) => {
    const ticket = ++requestRef.current
    setError('')
    setPending(true)
    if (kind === 'mv') silenceSong()
    if (kind === 'audio') {
      setLyricOpen(showLyricRef.current)
      setQueued({ id: '', title, artist, album: '', duration: 0, hasMv: false })
    }
    findPlayable(title, artist)
      .then((song) => {
        if (ticket !== requestRef.current) return
        return open(song, kind, ticket)
      })
      .catch((reason: unknown) => {
        if (ticket !== requestRef.current) return
        if (kind === 'mv') releaseSong()
        setError(kind === 'mv' && reason instanceof Error ? reason.message : PLAY_TIP)
        setPending(false)
      })
  }

  const warm = (song: MusicItem, kind: Kind) => {
    if (!song.id) return
    prefetchMedia(song.id, kind, kind === 'mv' ? mvQualityRef.current : audioQualityRef.current, song.mvId ?? '')
    if (kind === 'audio') prefetchLyric(song.id)
  }

  useEffect(() => {
    if (stage !== 'mv' || !mv?.song.id) {
      setMvQualityOptions(null)
      return
    }
    const song = mv.song
    const catalog = listedMvQualities(song.mvFormats) ?? ['sd']
    setMvQualityOptions(catalog)
    let cancel = false
    getPlayableMvQualities(song.id, song.mvId ?? '', song.mvFormats)
      .then((list) => {
        if (cancel) return
        setMvQualityOptions(list)
        if (list.includes(mvQualityRef.current)) return
        const next = nearestQuality(mvQualityRef.current, list)
        mvQualityRef.current = next
        setMvQuality(next)
        saveMvQuality(next)
      })
      .catch(() => undefined)
    return () => {
      cancel = true
    }
  }, [stage, mv])

  useEffect(() => {
    const song = audioRef.current
    if (song && !silenceAudioRef.current && !song.muted) song.volume = songVolume / 100
  }, [songVolume, audio])

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = mvVolume / 100
  }, [mvVolume, mv, stage])

  useEffect(() => {
    document.documentElement.style.setProperty('--song-brightness', String(songBrightness / 100))
  }, [songBrightness])

  useEffect(() => {
    document.documentElement.style.setProperty('--mv-brightness', String(mvBrightness / 100))
  }, [mvBrightness])

  const chooseSongVolume = (value: number) => {
    const next = Math.min(100, Math.max(0, Math.round(value)))
    setSongVolume(next)
    saveSongVolume(next)
  }

  const chooseSongBrightness = (value: number) => {
    const next = Math.min(160, Math.max(40, Math.round(value)))
    setSongBrightness(next)
    saveSongBrightness(next)
  }

  const chooseMvVolume = (value: number) => {
    const next = Math.min(100, Math.max(0, Math.round(value)))
    setMvVolume(next)
    saveMvVolume(next)
  }

  const chooseMvBrightness = (value: number) => {
    const next = Math.min(160, Math.max(40, Math.round(value)))
    setMvBrightness(next)
    saveMvBrightness(next)
  }

  const choosePosterQuality = (quality: PictureQuality) => {
    savePosterQuality(quality)
    setPosterQuality(quality)
  }

  const qualityLabel = (quality: PictureQuality) => QUALITY_OPTIONS.find((option) => option.id === quality)?.label ?? ''

  const chooseAudioQuality = (quality: PictureQuality) => {
    if (quality === audioQualityRef.current) return
    const previous = audioQualityRef.current
    saveSongQuality(quality)
    audioQualityRef.current = quality
    setAudioQuality(quality)
    const song = audio?.song.id ? audio.song : activeKind === 'audio' ? queued : null
    if (!song?.id || activeKind !== 'audio') return
    const previousUrl = audio?.url ?? ''
    const hadAudio = Boolean(audio?.url)
    audioTimeRef.current = audioRef.current?.currentTime ?? audioTimeRef.current
    const ticket = ++requestRef.current
    setPending(true)
    setError('')
    getMediaUrl(song.id, 'audio', quality)
      .then((url) => {
        if (ticket !== requestRef.current) return
        setAudio({ song, url })
        const profile = playedAudioProfile(song.id, quality)
        if (profile.quality !== quality) {
          setError(`这首歌没有${qualityLabel(quality)}，正在播放${qualityLabel(profile.quality)}。`)
          return
        }
        if (previousUrl && sameMediaFile(previousUrl, url)) setError('这次换音质后，拿到的还是同一个音频文件。')
      })
      .catch(() => {
        if (ticket !== requestRef.current) return
        audioQualityRef.current = previous
        setAudioQuality(previous)
        saveSongQuality(previous)
        setError(PLAY_TIP)
        if (!hadAudio) void open(song, 'audio')
      })
      .finally(() => {
        if (ticket === requestRef.current) setPending(false)
      })
  }

  const chooseMvQuality = (quality: PictureQuality) => {
    if (mvQualityOptions && !mvQualityOptions.includes(quality)) return
    saveMvQuality(quality)
    mvQualityRef.current = quality
    setMvQuality(quality)
    const playing = mv
    if (!playing?.song.id) return
    const previous = playing.url
    videoTimeRef.current = videoRef.current?.currentTime ?? 0
    setPending(true)
    setError('')
    getMediaUrl(playing.song.id, 'mv', quality, playing.song.mvId ?? '')
      .then((url) => {
        setMv({ song: playing.song, url })
        if (sameMediaFile(previous, url)) setError('这次换清晰度后，拿到的还是同一个视频文件。')
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'MV 地址获取失败')
      })
      .finally(() => setPending(false))
  }

  const warmNamed = (title: string, artist: string, kind: Kind) => {
    findPlayable(title, artist)
      .then((song) => warm(song, kind))
      .catch(() => undefined)
  }

  const toggle = () => {
    const el = mediaRef.current
    if (!el) return
    if (el.paused) void el.play().catch(() => undefined)
    else el.pause()
  }

  const seek = (value: number, resume = false) => {
    const el = mediaRef.current
    if (!el) return
    const limit = Number.isFinite(el.duration) ? el.duration : value
    const next = Math.max(0, Math.min(value, limit))
    el.currentTime = next
    setCurrent(next)
    if (resume && el.paused) void el.play().catch(() => undefined)
  }

  const scrub = (value: number) => {
    scrubbingRef.current = true
    seek(value)
  }

  const scrubEnd = (value: number) => {
    scrubbingRef.current = false
    seek(value, true)
  }

  const download = async (item: Loaded, kind: Kind) => {
    setError('')
    setDownloading(true)
    try {
      const selected = kind === 'mv' ? mvQualityRef.current : audioQualityRef.current
      const profile = kind === 'audio' ? playedAudioProfile(item.song.id, selected) : null
      const label = qualityLabel(profile?.quality ?? selected)
      const ext = profile?.ext ?? 'mp4'
      await saveMedia(item.url, mediaFilename(item.song.title, item.song.artist, kind, label, ext))
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '下载失败')
    } finally {
      setDownloading(false)
    }
  }

  const saveCover = async () => {
    if (!coverView || coverSaving) return
    const url = coverView.urls[coverView.index]
    if (!url) return
    setCoverSaving(true)
    setCoverNote('')
    try {
      await savePicture(url, pictureFilename(coverView.title, coverView.artist, coverView.index, coverView.urls.length))
    } catch (reason: unknown) {
      setCoverNote(reason instanceof Error ? reason.message : '图片保存失败')
    } finally {
      setCoverSaving(false)
    }
  }

  const enterFullscreen = async () => {
    const node = stageRef.current
    if (!node) return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await node.requestFullscreen()
  }

  useEffect(() => {
    const songId = dockSong?.id ?? ''
    setFavOn(Boolean(songId) && isFavorite(songId))
  }, [dockSong?.id, libraryVersion])

  const playRef = useRef(play)
  const playNamedRef = useRef(playNamed)
  const warmRef = useRef(warm)
  const warmNamedRef = useRef(warmNamed)
  const toggleFavRef = useRef(toggleSongFavorite)
  const removeFavRef = useRef(removeSongFavorite)
  const clearFavRef = useRef(clearSongFavorites)
  const dismissLyricRef = useRef(dismissLyric)
  playRef.current = play
  playNamedRef.current = playNamed
  warmRef.current = warm
  warmNamedRef.current = warmNamed
  toggleFavRef.current = toggleSongFavorite
  removeFavRef.current = removeSongFavorite
  clearFavRef.current = clearSongFavorites
  dismissLyricRef.current = dismissLyric
  const value = useMemo<PlayerApi>(
    () => ({
      play: (song, kind, nextQueue) => playRef.current(song, kind, nextQueue),
      playNamed: (title, artist, kind) => playNamedRef.current(title, artist, kind),
      warm: (song, kind = 'audio') => warmRef.current(song, kind),
      warmNamed: (title, artist, kind = 'audio') => warmNamedRef.current(title, artist, kind),
      toggleFavorite: (song) => toggleFavRef.current(song),
      removeFavorite: (id) => removeFavRef.current(id),
      clearFavorites: () => clearFavRef.current(),
      dismissLyric: () => dismissLyricRef.current(),
      pending,
      error,
      playingId,
      libraryVersion,
    }),
    [pending, error, playingId, libraryVersion],
  )

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {audio ? (
        <audio
          ref={audioRef}
          className="media-sink"
          onPlay={(event) => {
            if (silenceAudioRef.current) {
              event.currentTarget.pause()
              return
            }
            videoRef.current?.pause()
            bind(event.currentTarget)
          }}
          onPause={() => {
            if (!silenceAudioRef.current) bind(audioRef.current)
          }}
          onTimeUpdate={() => activeKind === 'audio' && !silenceAudioRef.current && bind(audioRef.current)}
          onLoadedMetadata={(event) => {
            const el = event.currentTarget
            const mark = audioTimeRef.current
            if (mark > 0.3 && el.currentTime < 0.3) el.currentTime = mark
            audioTimeRef.current = 0
            el.volume = songVolumeRef.current / 100
            if (!silenceAudioRef.current) bind(el)
          }}
          onEnded={() => {
            if (silenceAudioRef.current) return
            advance('ended')
          }}
          onError={(event) => {
            const el = event.currentTarget
            const code = el.error?.code ?? 0
            if (silenceAudioRef.current || !el.getAttribute('src') || code < 2) return
            setError(PLAY_TIP)
          }}
        />
      ) : null}
      {(audio || mv || queued) && (
        <div className="player-stack" ref={stackRef}>
          <div className="player-dock">
            <div className="dock-song">
              {dockPosters.length ? (
                <button type="button" className="song-cover poster-slot" aria-label="查看封面" onClick={() => openCover(dockSong, dockPosters[dockAt])}>
                  {dockPosters.map((url, index) => (
                    <img key={url} src={url} alt="" className={index === dockAt ? 'is-on' : ''} onError={() => hidePoster(url)} />
                  ))}
                </button>
              ) : (
                <span className="song-cover" />
              )}
              <div className="player-meta">
                {dockSong?.id ? (
                  <a className="player-title" href={`#/song/${dockSong.id}`} title={dockSong.title}>
                    {dockSong.title}
                  </a>
                ) : (
                  <strong className="player-title">{dockSong?.title}</strong>
                )}
                <span>
                  {dockSong?.artist}
                  {activeKind === 'mv' ? ' · MV' : ''}
                </span>
              </div>
              {dockSong?.id ? (
                <div className="dock-quick">
                  <button
                    type="button"
                    className={favOn ? 'dock-btn is-loved' : 'dock-btn'}
                    aria-pressed={favOn}
                    aria-label="收进我的音乐宇宙"
                    title={favOn ? '已收进我的音乐宇宙，再点一下移出' : '收进我的音乐宇宙'}
                    onClick={() => {
                      toggleSongFavorite(dockSong)
                      toast(favOn ? '已从我的音乐宇宙移出' : '已收进我的音乐宇宙')
                    }}
                  >
                    <Icon name={favOn ? 'heartFill' : 'heart'} />
                  </button>
                  <button type="button" className="dock-btn" aria-label="加入歌单" title="加入歌单" onClick={() => openPlaylistPicker(dockSong)}>
                    <Icon name="plus" />
                  </button>
                  <button type="button" className="dock-btn" aria-label="把这份喜欢分享出去" title="把这份喜欢分享出去" onClick={() => void shareSong(dockSong)}>
                    <Icon name="share" />
                  </button>
                </div>
              ) : null}
            </div>
            <div className="transport">
              <div className="transport-buttons">
                <button type="button" className="dock-btn" onClick={cycleMode} aria-label={`循环模式：${PLAY_MODE_LABEL[playMode]}，点击切换`} title={PLAY_MODE_LABEL[playMode]}>
                  <Icon name={MODE_ICON[playMode]} />
                </button>
                <button type="button" className="dock-btn" onClick={() => advance('prev')} aria-label="上一首" title="上一首">
                  <Icon name="prev" />
                </button>
                <button type="button" className="play-toggle" onClick={toggle} aria-label={paused ? '播放这首歌' : '暂停'}>
                  <PlayPauseIcon paused={paused} />
                </button>
                <button type="button" className="dock-btn" onClick={() => advance('next')} aria-label="下一首" title="下一首">
                  <Icon name="next" />
                </button>
                <button
                  type="button"
                  className={activeKind !== 'mv' && lyricOpen ? 'dock-btn is-on' : 'dock-btn'}
                  aria-pressed={activeKind === 'mv' ? undefined : lyricOpen}
                  aria-label={activeKind === 'mv' ? '全屏看 MV' : lyricOpen ? '隐藏歌词' : '显示歌词'}
                  title={activeKind === 'mv' ? '全屏看 MV' : lyricOpen ? '隐藏歌词' : '显示歌词'}
                  onClick={() => {
                    if (activeKind === 'mv' && mv) {
                      setStage('mv')
                      return
                    }
                    if (audio || queued) setLyricVisible(!showLyricRef.current)
                  }}
                >
                  <Icon name={activeKind === 'mv' ? 'mv' : 'lyric'} />
                </button>
              </div>
              <div className="transport-seek">
                <span className="time">{clock(current)}</span>
                <SeekBar current={current} duration={duration} onScrub={scrub} onScrubEnd={scrubEnd} />
                <span className="time">{clock(duration)}</span>
              </div>
            </div>
            <div className="player-actions">
              {activeKind === 'audio' && dockSong ? <QualitySwitch light label="音质" value={audioQuality} onChange={chooseAudioQuality} /> : null}
              {dockSong?.id && dockSong.hasMv && noMvTick >= 0 && !isSongWithoutMv(dockSong.id) && activeKind !== 'mv' ? (
                <button type="button" className="dock-btn" disabled={pending} onClick={() => play(dockSong, 'mv')} aria-label="看 MV" title="看 MV">
                  <Icon name="mv" />
                </button>
              ) : null}
              {active ? (
                <button
                  type="button"
                  className="dock-btn"
                  disabled={downloading || pending}
                  onClick={() => void download(active, activeKind)}
                  aria-label={downloading ? '下载中' : '下载'}
                  title={downloading ? '下载中…' : '下载'}
                >
                  {downloading ? <span className="spinner" aria-hidden="true" /> : <Icon name="download" />}
                </button>
              ) : null}
              <button type="button" className="dock-btn dock-queue" onClick={() => setQueueOpen(true)} aria-label="播放列表" title="播放列表">
                <Icon name="list" />
                {queue.length ? <small>{queue.length}</small> : null}
              </button>
              <DragMeter label="歌曲音量" value={songVolume} min={0} max={100} icon={<VolumeIcon muted={songVolume === 0} />} onChange={chooseSongVolume} />
              <DragMeter label="歌曲亮度" value={songBrightness} min={40} max={160} icon={<BrightnessIcon />} onChange={chooseSongBrightness} />
            </div>
            {error || pending ? (
              <p className={error ? 'dock-status is-error' : 'dock-status'} role={error ? 'alert' : 'status'}>
                {error || '正在为你寻找好声音……'}
              </p>
            ) : null}
          </div>
        </div>
      )}
      {lyricOpen && stage !== 'mv' && lyricSong ? (
        <div className="lyric-screen" role="dialog" aria-label={`${lyricSong.title} 歌词`}>
          <div className="lyric-bg-stack">
            {posters.length ? (
              posters.map((url, index) => (
                <div
                  key={url}
                  className={`lyric-bg${index === posterAt ? ' is-on' : ''}`}
                  style={{ backgroundImage: `url(${JSON.stringify(url)})` }}
                />
              ))
            ) : (
              <div className="lyric-bg lyric-bg-empty is-on" />
            )}
          </div>
          <div className="lyric-bg-mask" />
          <header className="lyric-screen-bar">
            <button type="button" className="lyric-back" onClick={() => setLyricVisible(false)}>
              收起
            </button>
            <div className="lyric-heading">
              <strong>{lyricSong.title}</strong>
              <span>{lyricSong.artist}</span>
            </div>
            <div className="lyric-tools">
              <button
                type="button"
                className={`comment-toggle${commentsOpen ? ' is-on' : ''}`}
                aria-pressed={commentsOpen}
                onClick={() => setCommentsOpen((open) => !open)}
              >
                <CommentIcon />
                <span className="comment-toggle-text">评论</span>
                {commentTotal !== null ? <span className="comment-toggle-count">{formatCommentCount(commentTotal)}</span> : null}
              </button>
              <DanmakuSwitch on={danmakuOn} onClick={toggleDanmaku} />
            </div>
          </header>
          <div className={`lyric-body${commentsOpen ? ' has-comments' : ''}`}>
            {danmaku ? <div className="lyric-danmaku">{danmaku}</div> : null}
            <div className={`lyric-disc${paused ? '' : ' is-on'}`}>
              <div className="lyric-poster">
                <div className="lyric-disc-ring" />
                <div
                  className={posterDragging ? 'poster-window is-drag' : 'poster-window'}
                  onPointerDown={onPosterDown}
                  onPointerMove={onPosterMove}
                  onPointerUp={onPosterUp}
                  onPointerCancel={onPosterCancel}
                  role="button"
                  tabIndex={0}
                  aria-label="查看封面"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openCover(lyricSong, posters[posterAt])
                    }
                  }}
                >
                  {posters.length ? (
                    <div
                      className={posterDragging ? 'poster-track is-drag' : 'poster-track'}
                      style={{ transform: `translateX(calc(${-posterAt * 100}% + ${dragX}px))` }}
                    >
                      {posters.map((url) => (
                        <img key={url} src={url} alt="" draggable={false} onError={() => hidePoster(url)} />
                      ))}
                    </div>
                  ) : (
                    <span />
                  )}
                </div>
              </div>
              {posters.length > 1 ? (
                <div className="poster-dots" role="tablist" aria-label="海报">
                  {posters.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      className={index === posterAt ? 'is-on' : ''}
                      aria-label={`第 ${index + 1} 张海报`}
                      aria-selected={index === posterAt}
                      onClick={() => {
                        setPosterIndex(index)
                        setPosterHold((value) => value + 1)
                      }}
                    />
                  ))}
                </div>
              ) : null}
              <QualitySwitch label="清晰度" value={posterQuality} onChange={choosePosterQuality} />
            </div>
            <LyricView lines={lyrics} status={lyricStatus} current={current} onSeek={(time) => seek(time, true)} />
            {commentsOpen ? <CommentPanel songId={lyricSong.id} knownTotal={commentTotal} /> : null}
          </div>
        </div>
      ) : null}

      <PlayQueue
        open={queueOpen}
        queue={queue}
        recent={getRecentPlays()}
        currentId={audio?.song.id ?? ''}
        onClose={() => setQueueOpen(false)}
        onPickQueue={(song) => {
          setQueueOpen(false)
          play(song, 'audio')
        }}
        onPickRecent={(song) => {
          setQueueOpen(false)
          play(song, 'audio', getRecentPlays())
        }}
      />
      {!audio && !mv && !queued && error ? (
        <div className="player-stack">
          <div className="player-dock">
            <p className="play-error">{error}</p>
          </div>
        </div>
      ) : null}

      {stage && active ? (
        <div className="mv-layer" role="dialog" aria-modal="true" aria-label={active.song.title}>
          <div
            className={`stage stage-${stage}${fullscreen ? ' is-fullscreen' : ''}${stageClean ? ' is-clean' : ''}`}
            ref={stageRef}
          >
            <header onPointerDown={armChromeHide} onPointerMove={armChromeHide}>
              <div>
                <strong>{active.song.title}</strong>
                <span>
                  {active.song.artist}
                  {stage === 'mv' ? ' · MV' : ' · 歌曲'}
                </span>
              </div>
              <div className="stage-tools">
                {stage === 'mv' ? <DanmakuSwitch on={danmakuOn} onClick={toggleDanmaku} /> : null}
                <button
                  type="button"
                  className="stage-tool"
                  disabled={downloading}
                  aria-label={downloading ? '下载中' : '下载'}
                  onClick={() => void download(active, stage)}
                >
                  <DownloadIcon />
                  <span className="stage-tool-label">{downloading ? '下载中' : '下载'}</span>
                </button>
                {stage === 'mv' ? (
                  <QualitySwitch
                    toolbar
                    label="清晰度"
                    value={(mvQualityOptions ?? ['sd']).includes(mvQuality) ? mvQuality : nearestQuality(mvQuality, mvQualityOptions ?? ['sd'])}
                    disabledValues={QUALITY_OPTIONS.filter((item) => !(mvQualityOptions ?? ['sd']).includes(item.id)).map((item) => item.id)}
                    onChange={chooseMvQuality}
                  />
                ) : null}
                <button
                  type="button"
                  className="stage-tool"
                  aria-label={fullscreen ? '退出全屏' : '全屏'}
                  onClick={() => void enterFullscreen()}
                >
                  {fullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
                  <span className="stage-tool-label">{fullscreen ? '退出全屏' : '全屏'}</span>
                </button>
                <button
                  type="button"
                  className="stage-tool stage-tool-close"
                  aria-label="关闭"
                  onClick={() => {
                    if (document.fullscreenElement) void document.exitFullscreen()
                    videoRef.current?.pause()
                    releaseSong()
                    setStage(null)
                  }}
                >
                  <CloseIcon />
                </button>
              </div>
              {error ? <p className="stage-note">{error}</p> : null}
            </header>
            {stage === 'mv' && mv ? (
              <div className="stage-picture">
                <video
                  ref={videoRef}
                  src={mv.url}
                  poster={coverUrl(mv.song.mvPic) || undefined}
                  playsInline
                  onClick={() => setStageClean((value) => !value)}
                  onPlay={() => bind(videoRef.current)}
                  onPause={() => bind(videoRef.current)}
                  onTimeUpdate={() => bind(videoRef.current)}
                  onLoadedMetadata={(event) => {
                    const mark = videoTimeRef.current
                    if (mark > 0.3) event.currentTarget.currentTime = mark
                    videoTimeRef.current = 0
                    event.currentTarget.volume = mvVolumeRef.current / 100
                    bind(event.currentTarget)
                    if (mark > 0.3) void event.currentTarget.play().catch(() => undefined)
                  }}
                />
                {danmaku}
              </div>
            ) : (
              <div className="audio-stage">
                <button type="button" className="audio-cover" aria-label="查看封面" onClick={() => openCover(active.song, coverUrl(active.song.image))}>
                  {coverUrl(active.song.image) ? <img src={coverUrl(active.song.image)} alt="" /> : <span />}
                </button>
                <LyricView lines={lyrics} status={lyricStatus} current={current} onSeek={(time) => seek(time, true)} />
              </div>
            )}
            <div className="stage-bar" onPointerDown={armChromeHide} onPointerMove={armChromeHide}>
              <div className="stage-transport">
                <button
                  type="button"
                  className="icon-btn icon-btn-light play-toggle"
                  onClick={toggle}
                  aria-label={paused ? '播放' : '暂停'}
                >
                  <PlayPauseIcon paused={paused} />
                </button>
                <SeekBar current={current} duration={duration} onScrub={scrub} onScrubEnd={scrubEnd} />
                <span className="time">
                  {clock(current)} / {clock(duration)}
                </span>
              </div>
              <DragMeter label="MV音量" value={mvVolume} min={0} max={100} icon={<VolumeIcon muted={mvVolume === 0} />} onChange={chooseMvVolume} />
              <DragMeter label="MV亮度" value={mvBrightness} min={40} max={160} icon={<BrightnessIcon />} onChange={chooseMvBrightness} />
            </div>
          </div>
        </div>
      ) : null}

      {coverView ? (
        <div className="cover-layer" onClick={() => setCoverView(null)}>
          <div
            className="cover-detail"
            role="dialog"
            aria-modal="true"
            aria-label={`${coverView.title} 封面`}
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <strong>{coverView.title}</strong>
                <span>{coverView.artist}</span>
              </div>
              <div className="cover-detail-actions">
                {coverView.urls.length > 1 ? (
                  <span className="cover-detail-count">
                    {coverView.index + 1} / {coverView.urls.length}
                  </span>
                ) : null}
                <button type="button" className="text-btn" disabled={coverSaving} onClick={() => void saveCover()}>
                  {coverSaving ? '保存中…' : '保存图片'}
                </button>
                <button type="button" className="text-btn" onClick={() => setCoverView(null)}>
                  关闭
                </button>
              </div>
            </header>
            <div className={coverView.urls.length > 1 ? 'cover-detail-stage' : 'cover-detail-stage is-single'}>
              {coverView.urls.length > 1 ? (
                <button type="button" className="cover-detail-nav" aria-label="上一张" onClick={() => slideCover(-1)}>
                  上一张
                </button>
              ) : null}
              <img
                src={coverView.urls[coverView.index]}
                alt=""
                onError={() => {
                  setCoverView((view) => {
                    if (!view) return view
                    const urls = view.urls.filter((_, index) => index !== view.index)
                    if (!urls.length) return null
                    return { ...view, urls, index: Math.min(view.index, urls.length - 1) }
                  })
                }}
              />
              {coverView.urls.length > 1 ? (
                <button type="button" className="cover-detail-nav" aria-label="下一张" onClick={() => slideCover(1)}>
                  下一张
                </button>
              ) : null}
            </div>
            {coverNote ? <p className="cover-detail-note">{coverNote}</p> : null}
          </div>
        </div>
      ) : null}
    </PlayerContext.Provider>
  )
}
