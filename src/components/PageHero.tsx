import type { ReactNode } from 'react'
import type { Copy } from '../data/brand'

const BARS = Array.from({ length: 28 }, (_, index) => index)

export function WaveArt({ className = '' }: { className?: string }) {
  return (
    <div className={`wave-art ${className}`} aria-hidden="true">
      {BARS.map((index) => (
        <i key={index} style={{ animationDelay: `${(index % 7) * -0.18}s`, height: `${28 + ((index * 37) % 64)}%` }} />
      ))}
    </div>
  )
}

export function PageHero({ copy, children, compact = false }: { copy: Copy; children?: ReactNode; compact?: boolean }) {
  return (
    <header className={`page-hero${compact ? ' is-compact' : ''}`}>
      <div className="page-hero-copy">
        <p className="eyebrow">{copy.en}</p>
        <h1>{copy.title}</h1>
        <p>{copy.desc}</p>
        {children ? <div className="hero-actions">{children}</div> : null}
      </div>
      <WaveArt />
    </header>
  )
}
