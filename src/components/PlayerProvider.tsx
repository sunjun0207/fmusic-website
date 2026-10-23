import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { LyricView } from './LyricView'
import { getLyric, prefetchLyric, type LyricLine } from '../lib/lyric'
import { mediaFilename, saveMedia } from '../lib/saveMedia'
import { getMediaUrl, prefetchMedia } from '../lib/play'
import { coverUrl, findPlayable, type MusicItem } from '../lib/search'

type Kind = 'audio' | 'mv'
type Loaded = { song: MusicItem; url: string }

type PlayerApi = {
  play: (song: MusicItem, kind: Kind) => void
  playNamed: (title: string, artist: string, kind: Kind) => void
  warm: (song: MusicItem, kind?: Kind) => void
  warmNamed: (title: string, artist: string, kind?: Kind) => void
  pending: boolean
  error: string
  playingId: string
}

const PlayerContext = createContext<PlayerApi | null>(null)

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
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [lyricStatus, setLyricStatus] = useState<'loading' | 'ready' | 'empty'>('empty')
  const [lyricOpen, setLyricOpen] = useState(false)
  const [queued, setQueued] = useState<MusicItem | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const stackRef = useRef<HTMLDivElement>(null)
  const scrubbingRef = useRef(false)
  const requestRef = useRef(0)

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
    if (!audio?.url || activeKind !== 'audio') return
    void audioRef.current?.play().catch(() => undefined)
  }, [audio, activeKind])

  useEffect(() => {
    if (stage !== 'mv' || !mv?.url) return
    void videoRef.current?.play().catch(() => undefined)
  }, [stage, mv])

  useEffect(() => {
    if (stage !== 'mv') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.fullscreenElement) setStage(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage])

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

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

  const open = async (song: MusicItem, kind: Kind, request?: number) => {
    const ticket = request ?? ++requestRef.current
    if (kind === 'audio' && audio?.song.id === song.id && audio.url) {
      const el = audioRef.current
      setMv(null)
      setStage(null)
      setQueued(song)
      setLyricOpen(true)
      setPlayingId(song.id)
      setPending(false)
      if (!lyricOpen || !el) return
      if (el.paused) void el.play()
      else el.pause()
      return
    }
    if (kind === 'mv' && mv?.song.id === song.id && mv.url) {
      audioRef.current?.pause()
      setStage('mv')
      setPlayingId(song.id)
      setPending(false)
      const el = videoRef.current
      if (el?.paused) void el.play()
      return
    }
    if (kind === 'mv' && !song.hasMv) {
      setError('这首歌暂时没有 MV')
      setPending(false)
      return
    }
    setError('')
    setPending(true)
    setPlayingId(song.id)
    setCurrent(0)
    setDuration(0)
    if (kind === 'audio') {
      setQueued(song)
      setLyricOpen(true)
      setMv(null)
      setStage(null)
      prefetchLyric(song.id)
    }
    try {
      const url = await getMediaUrl(song.id, kind)
      if (ticket !== requestRef.current) return
      if (kind === 'audio') {
        setMv(null)
        setStage(null)
        setAudio({ song, url })
      } else {
        audioRef.current?.pause()
        setMv({ song, url })
        setStage('mv')
      }
    } catch (reason: unknown) {
      if (ticket !== requestRef.current) return
      setError(reason instanceof Error ? reason.message : '播放失败')
    } finally {
      if (ticket === requestRef.current) setPending(false)
    }
  }

  const play = (song: MusicItem, kind: Kind) => {
    void open(song, kind)
  }

  const playNamed = (title: string, artist: string, kind: Kind) => {
    const ticket = ++requestRef.current
    setError('')
    setPending(true)
    if (kind === 'audio') {
      setLyricOpen(true)
      setQueued({ id: '', title, artist, album: '', duration: 0, hasMv: false })
    }
    findPlayable(title, artist)
      .then((song) => {
        if (ticket !== requestRef.current) return
        return open(song, kind, ticket)
      })
      .catch((reason: unknown) => {
        if (ticket !== requestRef.current) return
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

  const playRef = useRef(play)
  const playNamedRef = useRef(playNamed)
  const warmRef = useRef(warm)
  const warmNamedRef = useRef(warmNamed)
  playRef.current = play
  playNamedRef.current = playNamed
  warmRef.current = warm
  warmNamedRef.current = warmNamed
  const value = useMemo<PlayerApi>(
    () => ({
      play: (song, kind) => playRef.current(song, kind),
      playNamed: (title, artist, kind) => playNamedRef.current(title, artist, kind),
      warm: (song, kind = 'audio') => warmRef.current(song, kind),
      warmNamed: (title, artist, kind = 'audio') => warmNamedRef.current(title, artist, kind),
      pending,
      error,
      playingId,
    }),
    [pending, error, playingId],
  )

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {audio ? (
        <audio
          ref={audioRef}
          className="media-sink"
          src={audio.url}
          onPlay={() => bind(audioRef.current)}
          onPause={() => bind(audioRef.current)}
          onTimeUpdate={() => activeKind === 'audio' && bind(audioRef.current)}
          onLoadedMetadata={() => bind(audioRef.current)}
        />
      ) : null}
      {(audio || mv || queued) && (
        <div className="player-stack" ref={stackRef}>
          <div className="player-dock">
          {coverUrl(dockSong?.image) ? (
            <img className="song-cover" src={coverUrl(dockSong?.image)} alt="" />
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
            <button type="button" className="icon-btn" onClick={toggle} aria-label={paused ? '播放' : '暂停'}>
              {paused ? '播放' : '暂停'}
            </button>
            <SeekBar current={current} duration={duration} onScrub={scrub} onScrubEnd={scrubEnd} />
            <span className="time">
              {clock(current)} / {clock(duration)}
            </span>
          </div>
          <div className="player-actions">
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
              className="text-btn"
              onClick={() => {
                if (activeKind === 'mv' && mv) setStage('mv')
                else if (audio || queued) setLyricOpen(true)
              }}
            >
              {activeKind === 'mv' ? '全屏' : '歌词'}
            </button>
            {audio?.song.hasMv ? (
              <button type="button" className="text-btn" disabled={pending} onClick={() => play(audio.song, 'mv')}>
                播放MV
              </button>
            ) : null}
          </div>
          {error ? <p className="play-error">{error}</p> : null}
          {pending ? <p className="meta">正在获取播放地址…</p> : null}
          </div>
        </div>
      )}
      {lyricOpen && stage !== 'mv' && lyricSong ? (
        <div className="lyric-screen" role="dialog" aria-label={`${lyricSong.title} 歌词`}>
          {coverUrl(lyricSong.image) ? (
            <div className="lyric-bg" style={{ backgroundImage: `url(${JSON.stringify(coverUrl(lyricSong.image))})` }} />
          ) : (
            <div className="lyric-bg lyric-bg-empty" />
          )}
          <div className="lyric-bg-mask" />
          <header className="lyric-screen-bar">
            <button type="button" className="lyric-back" onClick={() => setLyricOpen(false)}>
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
                {coverUrl(lyricSong.image) ? <img src={coverUrl(lyricSong.image)} alt="" /> : <span />}
              </div>
            </div>
            <LyricView lines={lyrics} status={lyricStatus} current={current} onSeek={(time) => seek(time, true)} />
          </div>
        </div>
      ) : null}

      {!audio && !mv && !queued && error ? (
        <div className="player-stack">
          <div className="player-dock">
            <p className="play-error">{error}</p>
          </div>
        </div>
      ) : null}

      {stage && active ? (
        <div className="mv-layer" role="dialog" aria-modal="true" aria-label={active.song.title}>
          <div className={`stage stage-${stage}${fullscreen ? ' is-fullscreen' : ''}`} ref={stageRef}>
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
              <button type="button" className="icon-btn icon-btn-light" onClick={toggle}>
                {paused ? '播放' : '暂停'}
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
