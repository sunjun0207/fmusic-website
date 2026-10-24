import { useLayoutEffect, useRef, useState } from 'react'
import type { LyricLine } from '../lib/lyric'

type Props = {
  lines: LyricLine[]
  status: 'loading' | 'ready' | 'empty'
  current: number
  onSeek: (time: number) => void
}

function clock(sec: number) {
  const safe = Math.max(0, Math.floor(sec))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

function centerLineIndex(root: HTMLElement) {
  const mid = root.scrollTop + root.clientHeight / 2
  let best = -1
  let bestDist = Number.POSITIVE_INFINITY
  root.querySelectorAll<HTMLElement>('[data-i]').forEach((el) => {
    const dist = Math.abs(el.offsetTop + el.offsetHeight / 2 - mid)
    if (dist < bestDist) {
      bestDist = dist
      best = Number(el.dataset.i)
    }
  })
  return best
}

function scrollLine(root: HTMLElement, index: number, smooth: boolean) {
  const el = root.querySelector<HTMLElement>(`[data-i="${index}"]`)
  if (!el) return
  const top = el.offsetTop - root.clientHeight / 2 + el.offsetHeight / 2
  root.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' })
}

export function LyricView({ lines, status, current, onSeek }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const userLockRef = useRef(false)
  const programmaticRef = useRef(false)
  const dragRef = useRef<{ y: number; top: number; moved: boolean } | null>(null)
  const suppressClickRef = useRef(false)
  const timerRef = useRef(0)
  const alignKeyRef = useRef('')
  const linesRef = useRef(lines)
  const activeRef = useRef(-1)
  const ignoreUntilRef = useRef(0)
  const [pick, setPick] = useState<number | null>(null)
  linesRef.current = lines

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const apply = () => {
      const next = `${Math.max(0, root.clientHeight / 2 - 28)}px`
      if (root.style.getPropertyValue('--lyric-pad') !== next) root.style.setProperty('--lyric-pad', next)
      if (userLockRef.current || activeRef.current < 0) return
      ignoreUntilRef.current = performance.now() + 180
      programmaticRef.current = true
      scrollLine(root, activeRef.current, false)
      programmaticRef.current = false
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  let activeIndex = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i]!.time <= current + 0.05) activeIndex = i
    else break
  }
  activeRef.current = activeIndex
  const shown = pick ?? activeIndex
  let sung = 0
  if (activeIndex >= 0 && pick === null) {
    const start = lines[activeIndex]!.time
    const end = lines[activeIndex + 1]?.time ?? start + 6
    const span = Math.max(0.6, end - start)
    sung = Math.min(1, Math.max(0, (current - start) / span))
  }

  const releaseFollow = (delay = 560) => {
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      userLockRef.current = false
      setPick(null)
      window.requestAnimationFrame(() => {
        const root = rootRef.current
        const index = activeRef.current
        if (!root || index < 0 || userLockRef.current) return
        ignoreUntilRef.current = performance.now() + 180
        programmaticRef.current = true
        scrollLine(root, index, false)
        programmaticRef.current = false
      })
    }, delay)
  }

  const commit = (index: number) => {
    const line = linesRef.current[index]
    const root = rootRef.current
    if (!line || !root || index < 0) {
      userLockRef.current = false
      setPick(null)
      return
    }
    userLockRef.current = true
    setPick(index)
    ignoreUntilRef.current = performance.now() + 180
    programmaticRef.current = true
    scrollLine(root, index, false)
    programmaticRef.current = false
    onSeek(line.time)
    releaseFollow()
  }

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || userLockRef.current || activeIndex < 0) return
    const signature = `${lines.length}:${lines[0]?.time ?? ''}`
    const smooth = alignKeyRef.current === signature
    alignKeyRef.current = signature
    programmaticRef.current = true
    ignoreUntilRef.current = performance.now() + (smooth ? 700 : 180)
    scrollLine(root, activeIndex, smooth)
    if (!smooth) {
      programmaticRef.current = false
      return
    }
    const timer = window.setTimeout(() => {
      programmaticRef.current = false
    }, 520)
    return () => window.clearTimeout(timer)
  }, [activeIndex, lines])

  useLayoutEffect(() => {
    return () => window.clearTimeout(timerRef.current)
  }, [])

  const preview = (index: number) => {
    if (index < 0) return
    setPick((prev) => (prev === index ? prev : index))
  }

  return (
    <div className={`lyric-view${pick !== null ? ' is-picking' : ''}`}>
      {pick !== null && lines[pick] ? (
        <button
          type="button"
          className="lyric-jump"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => commit(pick)}
        >
          <i />
          <span>{clock(lines[pick].time)}</span>
        </button>
      ) : null}
      <div
        className="lyric-list"
        ref={rootRef}
        onScroll={(event) => {
          if (performance.now() < ignoreUntilRef.current || !event.nativeEvent.isTrusted || programmaticRef.current || dragRef.current) return
          const root = rootRef.current
          if (!root || linesRef.current.length === 0) return
          userLockRef.current = true
          preview(centerLineIndex(root))
          window.clearTimeout(timerRef.current)
          timerRef.current = window.setTimeout(() => {
            const node = rootRef.current
            if (!node) return
            commit(centerLineIndex(node))
          }, 280)
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return
          const root = rootRef.current
          if (!root) return
          dragRef.current = { y: event.clientY, top: root.scrollTop, moved: false }
          try {
            root.setPointerCapture(event.pointerId)
          } catch {
            /* pointer may already be gone */
          }
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current
          const root = rootRef.current
          if (!drag || !root) return
          const dy = event.clientY - drag.y
          if (!drag.moved && Math.abs(dy) < 5) return
          drag.moved = true
          userLockRef.current = true
          window.clearTimeout(timerRef.current)
          programmaticRef.current = true
          root.scrollTop = drag.top - dy
          programmaticRef.current = false
          preview(centerLineIndex(root))
        }}
        onPointerUp={() => {
          const drag = dragRef.current
          dragRef.current = null
          if (!drag?.moved) return
          suppressClickRef.current = true
          const root = rootRef.current
          commit(root ? centerLineIndex(root) : -1)
        }}
        onPointerCancel={() => {
          const drag = dragRef.current
          dragRef.current = null
          if (!drag?.moved) return
          const root = rootRef.current
          commit(root ? centerLineIndex(root) : -1)
        }}
      >
        <div className="lyric-pad" aria-hidden="true" />
        {status === 'loading' ? <p className="lyric-empty">正在加载歌词…</p> : null}
        {status === 'empty' ? <p className="lyric-empty">暂无歌词</p> : null}
        {status === 'ready'
          ? lines.map((line, index) => {
              const distance = shown < 0 ? 3 : Math.abs(index - shown)
              const playing = pick === null && index === activeIndex
              const role =
                distance === 0 ? (pick !== null ? ' picking' : ' active') : distance === 1 ? ' closer' : distance === 2 ? ' near' : ''
              return (
                <button
                  key={`${line.time}-${index}`}
                  type="button"
                  data-i={index}
                  className={`lyric-line${role}`}
                  onClick={() => {
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false
                      return
                    }
                    commit(index)
                  }}
                >
                  <span className="lyric-words">
                    {line.lineLyric}
                    {playing ? (
                      <span className="lyric-sweep" style={{ width: `${(sung * 100).toFixed(1)}%` }} aria-hidden="true">
                        {line.lineLyric}
                      </span>
                    ) : null}
                  </span>
                </button>
              )
            })
          : null}
        <div className="lyric-pad" aria-hidden="true" />
      </div>
    </div>
  )
}
