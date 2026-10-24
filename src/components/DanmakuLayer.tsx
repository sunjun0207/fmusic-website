import { useEffect, useRef, useState } from 'react'
import type { SongComment } from '../lib/comment'

type Flying = { key: string; text: string; lane: number; speed: number; delay: number; gradient: string }

const LANES = 2
const GRADIENTS = [
  'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 14%, rgba(176,255,238,0.92) 50%, rgba(255,255,255,0.9) 86%, rgba(255,255,255,0) 100%)',
  'linear-gradient(90deg, rgba(255,232,186,0) 0%, rgba(255,246,220,0.95) 16%, rgba(255,255,255,0.9) 54%, rgba(255,210,140,0.88) 84%, rgba(255,232,186,0) 100%)',
  'linear-gradient(90deg, rgba(210,232,255,0) 0%, rgba(255,255,255,0.94) 18%, rgba(186,216,255,0.9) 58%, rgba(255,255,255,0.86) 84%, rgba(210,232,255,0) 100%)',
]

function brief(text: string) {
  const line = text.replace(/\s+/g, ' ').trim()
  return line.length > 42 ? `${line.slice(0, 42)}…` : line
}

export function DanmakuLayer({
  items,
  duration,
  paused,
  insetTop = 0,
}: {
  items: SongComment[]
  current: number
  duration: number
  paused: boolean
  insetTop?: number
}) {
  const [flying, setFlying] = useState<Flying[]>([])
  const cursor = useRef(0)
  const laneReady = useRef<number[]>(Array(LANES).fill(0))
  const seeded = useRef(false)
  const identity = items.map((item) => item.id).join(',')

  useEffect(() => {
    cursor.current = 0
    laneReady.current = Array(LANES).fill(0)
    seeded.current = false
    setFlying([])
  }, [identity])

  useEffect(() => {
    if (!items.length || paused || duration <= 0) return
    const launch = (lane: number, delay: number) => {
      const item = items[cursor.current % items.length]
      const text = brief(item.text)
      const speed = 18 + (text.length % 5) * 1.4 + lane * 1.6
      cursor.current += 1
      laneReady.current[lane] = performance.now() + Math.max(6500, speed * 420 + delay * 1000)
      return {
        key: `${item.id}:${cursor.current}`,
        text,
        lane,
        speed,
        delay,
        gradient: GRADIENTS[cursor.current % GRADIENTS.length],
      }
    }
    if (!seeded.current) {
      const born: Flying[] = []
      const count = Math.min(items.length, LANES)
      for (let lane = 0; lane < count; lane += 1) born.push(launch(lane, -(3 + lane * 5)))
      seeded.current = true
      setFlying(born)
    }

    const timer = window.setInterval(() => {
      const now = performance.now()
      const lane = laneReady.current.findIndex((time) => time <= now)
      if (lane < 0) return
      const next = launch(lane, 0)
      setFlying((list) => [...list, next].slice(-12))
    }, 3600)
    return () => window.clearInterval(timer)
  }, [duration, identity, items, paused])

  if (!flying.length) return null
  return (
    <div className={`danmaku-layer${paused ? ' is-paused' : ''}`} style={{ top: insetTop }} aria-hidden="true">
      {flying.map((item) => (
        <span
          key={item.key}
          className="danmaku-item"
          style={{
            top: 2 + item.lane * 26,
            backgroundImage: item.gradient,
            animationDuration: `${item.speed}s`,
            animationDelay: item.delay ? `${item.delay}s` : undefined,
          }}
          onAnimationEnd={() => setFlying((list) => list.filter((entry) => entry.key !== item.key))}
        >
          {item.text}
        </span>
      ))}
    </div>
  )
}
