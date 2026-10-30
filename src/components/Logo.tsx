import { useId } from 'react'

export function LogoMark({ size = 36 }: { size?: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="0.5" stopColor="#B34DFF" />
          <stop offset="1" stopColor="#F04D9A" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill={`url(#${id}-g)`} />
      <g stroke="#fff" strokeWidth="3" strokeLinecap="round">
        <path d="M10 18v4" />
        <path d="M15 14v12" />
        <path d="M20 10v20" />
        <path d="M25 15v10" />
        <path d="M30 18v4" />
      </g>
    </svg>
  )
}

export function Logo() {
  return (
    <a className="logo" href="#/home" aria-label="音浪 SOUNDWAVE 首页">
      <LogoMark />
      <span className="logo-text">
        <b>音浪</b>
        <small>SOUNDWAVE</small>
      </span>
    </a>
  )
}
