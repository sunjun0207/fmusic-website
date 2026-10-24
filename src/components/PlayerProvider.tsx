import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { PlayQueue } from './PlayQueue'
import { LyricView } from './LyricView'
import {
  addRecentPlay,
  clearFavorites,
  getPlayMode,
  getRecentPlays,
  isFavorite,
  removeFavorite,
  savePlayMode,
  toggleFavorite,
} from '../lib/library'
import { getLyric, prefetchLyric, type LyricLine } from '../lib/lyric'
import { nextPlayMode, PLAY_MODE_LABEL, resolveAdvance, type AdvanceDirection, type PlayMode } from '../lib/playback'
import { mediaFilename, saveMedia } from '../lib/saveMedia'
import { getMediaUrl, prefetchMedia } from '../lib/play'
import { coverUrl, findPlayable, isSongWithoutMv, rememberNoMv, songPosters, subscribeNoMv, type MusicItem } from '../lib/search'

type Kind = 'audio' | 'mv'
type Loaded = { song: MusicItem; url: string }

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
}

const PlayerContext = createContext<PlayerApi | null>(null)

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
  const [brokenPosters, setBrokenPosters] = useState<string[]>([])
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
  const stackRef = useRef<HTMLDivElement>(null)
  const scrubbingRef = useRef(false)
  const requestRef = useRef(0)
  const queueRef = useRef<MusicItem[]>([])
  const modeRef = useRef<PlayMode>(playMode)
  const historyRef = useRef<string[]>([])
  const audioSongRef = useRef<MusicItem | null>(null)
  const showLyricRef = useRef(true)
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

  const lyricSong = audio?.song.id ? audio.song : queued
  const lyricId = lyricSong?.id ?? ''
  const hidePoster = (url: string) => {
    setBrokenPosters((list) => (list.includes(url) ? list : [...list, url]))
  }
  const dockPosters = useMemo(
    () => songPosters(dockSong).filter((url) => !brokenPosters.includes(url)),
    [dockSong, brokenPosters],
  )
  const posters = useMemo(
    () => songPosters(lyricSong).filter((url) => !brokenPosters.includes(url)),
    [lyricSong, brokenPosters],
  )
  const posterToken = `${dockSong?.id ?? ''}|${lyricSong?.id ?? ''}|${dockPosters.join('|')}|${posters.join('|')}`
  const posterCount = Math.max(dockPosters.length, posters.length)
  const posterAt = posters.length ? posterIndex % posters.length : 0
  const dockAt = dockPosters.length ? posterIndex % dockPosters.length : 0

  const setLyricVisible = (open: boolean) => {
    showLyricRef.current = open
    setLyricOpen(open)
  }

  useEffect(() => {
    setPosterIndex(0)
  }, [posterToken])

  useEffect(() => {
    if (paused || posterCount < 2) return
    const timer = window.setInterval(() => {
      setPosterIndex((value) => (value + 1) % posterCount)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [paused, posterToken, posterCount])

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
    el.volume = 1
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
      if (el.paused) void el.play()
      else el.pause()
      return
    }
    if (kind === 'mv' && mv?.song.id === song.id && mv.url) {
      silenceSong()
      setStage('mv')
      setPlayingId(song.id)
      setPending(false)
      const el = videoRef.current
      if (el?.paused) void el.play()
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
      const url = await getMediaUrl(song.id, kind)
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
      const message = reason instanceof Error ? reason.message : '播放失败'
      if (kind === 'mv' && message.includes('没有')) rememberNoMv(song.id)
      setError(message)
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
        setError(reason instanceof Error ? reason.message : '播放失败')
        setPending(false)
      })
  }

  const warm = (song: MusicItem, kind: Kind) => {
    if (!song.id) return
    prefetchMedia(song.id, kind)
    if (kind === 'audio') prefetchLyric(song.id)
  }

  const warmNamed = (title: string, artist: string, kind: Kind) => {
    findPlayable(title, artist)
      .then((song) => warm(song, kind))
      .catch(() => undefined)
  }

  const toggle = () => {
    const el = mediaRef.current
    if (!el) return
    if (el.paused) void el.play()
    else el.pause()
  }

  const seek = (value: number, resume = false) => {
    const el = mediaRef.current
    if (!el) return
    const limit = Number.isFinite(el.duration) ? el.duration : value
    const next = Math.max(0, Math.min(value, limit))
    el.currentTime = next
    setCurrent(next)
    if (resume && el.paused) void el.play()
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
      await saveMedia(item.url, mediaFilename(item.song.title, item.song.artist, kind))
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '下载失败')
    } finally {
      setDownloading(false)
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
  playRef.current = play
  playNamedRef.current = playNamed
  warmRef.current = warm
  warmNamedRef.current = warmNamed
  toggleFavRef.current = toggleSongFavorite
  removeFavRef.current = removeSongFavorite
  clearFavRef.current = clearSongFavorites
  const value = useMemo<PlayerApi>(
    () => ({
      play: (song, kind, nextQueue) => playRef.current(song, kind, nextQueue),
      playNamed: (title, artist, kind) => playNamedRef.current(title, artist, kind),
      warm: (song, kind = 'audio') => warmRef.current(song, kind),
      warmNamed: (title, artist, kind = 'audio') => warmNamedRef.current(title, artist, kind),
      toggleFavorite: (song) => toggleFavRef.current(song),
      removeFavorite: (id) => removeFavRef.current(id),
      clearFavorites: () => clearFavRef.current(),
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
            if (!silenceAudioRef.current) bind(el)
          }}
          onEnded={() => {
            if (silenceAudioRef.current) return
            advance('ended')
          }}
        />
      ) : null}
      {(audio || mv || queued) && (
        <div className="player-stack" ref={stackRef}>
          <div className="player-dock">
          {dockPosters.length ? (
            <span className="song-cover poster-slot">
              {dockPosters.map((url, index) => (
                <img key={url} src={url} alt="" className={index === dockAt ? 'is-on' : ''} onError={() => hidePoster(url)} />
              ))}
            </span>
          ) : (
            <span className="song-cover" />
          )}
          <div className="player-meta">
            <strong>{dockSong?.title}</strong>
            <span>
              {dockSong?.artist}
              {activeKind === 'mv' ? ' · MV' : ''}
            </span>
          </div>
          <div className="transport">
            <button type="button" className="text-btn" onClick={() => advance('prev')} aria-label="上一首">
              上一首
            </button>
            <button type="button" className="icon-btn play-toggle" onClick={toggle} aria-label={paused ? '播放' : '暂停'}>
              <PlayPauseIcon paused={paused} />
            </button>
            <button type="button" className="text-btn" onClick={() => advance('next')} aria-label="下一首">
              下一首
            </button>
            <SeekBar current={current} duration={duration} onScrub={scrub} onScrubEnd={scrubEnd} />
            <span className="time">
              {clock(current)} / {clock(duration)}
            </span>
          </div>
          <div className="player-actions">
            <button
              type="button"
              className="text-btn"
              onClick={cycleMode}
              aria-label={`循环模式：${PLAY_MODE_LABEL[playMode]}，点击切换`}
            >
              {PLAY_MODE_LABEL[playMode]}
            </button>
            <button type="button" className="text-btn" onClick={() => setQueueOpen(true)}>
              播放列表
            </button>
            {dockSong?.id ? (
              <button
                type="button"
                className={favOn ? 'text-btn fav-on' : 'text-btn'}
                onClick={() => toggleSongFavorite(dockSong)}
                aria-label={favOn ? '取消收藏' : '收藏'}
              >
                {favOn ? '已收藏' : '收藏'}
              </button>
            ) : null}
            {active ? (
              <button
                type="button"
                className="text-btn"
                disabled={downloading || pending}
                onClick={() => void download(active, activeKind)}
              >
                {downloading ? '下载中…' : '下载'}
              </button>
            ) : null}
            <button
              type="button"
              className={activeKind !== 'mv' && lyricOpen ? 'text-btn is-on' : 'text-btn'}
              aria-pressed={activeKind === 'mv' ? undefined : lyricOpen}
              onClick={() => {
                if (activeKind === 'mv' && mv) {
                  setStage('mv')
                  return
                }
                if (audio || queued) setLyricVisible(!showLyricRef.current)
              }}
            >
              {activeKind === 'mv' ? '全屏' : lyricOpen ? '隐藏歌词' : '显示歌词'}
            </button>
            {dockSong?.id ? (
              dockSong.hasMv && noMvTick >= 0 && !isSongWithoutMv(dockSong.id) ? (
                <button type="button" className="text-btn" disabled={pending} onClick={() => play(dockSong, 'mv')}>
                  播放MV
                </button>
              ) : (
                <span className="mv-none">暂无MV</span>
              )
            ) : null}
          </div>
          {error ? <p className="play-error">{error}</p> : null}
          {pending ? <p className="meta">正在获取播放地址…</p> : null}
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
          </header>
          <div className="lyric-body">
            <div className={`lyric-disc${paused ? '' : ' is-on'}`}>
              <div className="lyric-disc-ring">
                {posters.length ? (
                  posters.map((url, index) => (
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className={index === posterAt ? 'is-on' : ''}
                      onError={() => hidePoster(url)}
                    />
                  ))
                ) : (
                  <span />
                )}
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
                      onClick={() => setPosterIndex(index)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            <LyricView lines={lyrics} status={lyricStatus} current={current} onSeek={(time) => seek(time, true)} />
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
            <header>
              <div>
                <strong>{active.song.title}</strong>
                <span>
                  {active.song.artist}
                  {stage === 'mv' ? ' · MV' : ' · 歌曲'}
                </span>
              </div>
              <div className="player-actions">
                <button
                  type="button"
                  className="btn btn-line"
                  disabled={downloading}
                  onClick={() => void download(active, stage)}
                >
                  {downloading ? '下载中…' : '下载'}
                </button>
                <button type="button" className="btn btn-line" onClick={() => void enterFullscreen()}>
                  {fullscreen ? '退出全屏' : '全屏'}
                </button>
                <button
                  type="button"
                  className="btn btn-line"
                  onClick={() => {
                    if (document.fullscreenElement) void document.exitFullscreen()
                    videoRef.current?.pause()
                    releaseSong()
                    setStage(null)
                  }}
                >
                  关闭
                </button>
              </div>
            </header>
            {stage === 'mv' && mv ? (
              <video
                ref={videoRef}
                src={mv.url}
                poster={coverUrl(mv.song.mvPic) || undefined}
                playsInline
                onClick={() => setStageClean((value) => !value)}
                onPlay={() => bind(videoRef.current)}
                onPause={() => bind(videoRef.current)}
                onTimeUpdate={() => bind(videoRef.current)}
                onLoadedMetadata={() => bind(videoRef.current)}
              />
            ) : (
              <div className="audio-stage">
                <div className="audio-cover">
                  {coverUrl(active.song.image) ? <img src={coverUrl(active.song.image)} alt="" /> : <span />}
                </div>
                <LyricView lines={lyrics} status={lyricStatus} current={current} onSeek={(time) => seek(time, true)} />
              </div>
            )}
            <div className="stage-bar">
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
          </div>
        </div>
      ) : null}
    </PlayerContext.Provider>
  )
}
