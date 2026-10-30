import { useId } from 'react'
import { BRAND, BRAND_CN, PRODUCT } from '../lib/site'

export function LogoMark({ size = 36 }: { size?: number }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF6B6B" />
          <stop offset="1" stopColor="#E03131" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill={`url(#${id}-g)`} />
      <circle cx="18" cy="18" r="8" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="18" cy="18" r="2.6" fill="#fff" />
    </svg>
  )
}

export function Logo() {
  return (
    <a className="logo" href="#/home" aria-label={`${PRODUCT} 首页`}>
      <LogoMark />
      <span className="logo-text">
        <small>{BRAND_CN}</small>
        <b>{BRAND}</b>
      </span>
    </a>
  )
}
