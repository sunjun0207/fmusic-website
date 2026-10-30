import type { ReactNode } from 'react'

const PATHS = {
  play: <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  prev: (
    <>
      <path d="M17 6v12L8.5 12 17 6Z" fill="currentColor" stroke="none" />
      <path d="M7 6v12" />
    </>
  ),
  next: (
    <>
      <path d="M7 6v12l8.5-6L7 6Z" fill="currentColor" stroke="none" />
      <path d="M17 6v12" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />,
  heartFill: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" fill="currentColor" />,
  share: (
    <>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  mv: (
    <>
      <rect x="3" y="5.5" width="13" height="13" rx="2.5" />
      <path d="m16 10 5-3v10l-5-3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4-4" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  fire: <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.3-5.4 3.6-7.8.4 1.6 1.3 2.6 2.4 3.2.2-2.8 1.4-5.6 3.9-7.2-.3 2.6.6 4.4 2 6 1.2 1.4 1.1 3.5 1.1 5.6 0 3.8-2.6 6.4-6.5 6.4Z" />,
  wave: <path d="M4 12h1.5M8 8v8M11.5 5v14M15 9v6M18.5 7v10M21 12h-.5" />,
  radio: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="3" />
      <path d="m7 8 9-4.5" />
      <circle cx="15.5" cy="14" r="2.5" />
      <path d="M6.5 12.5h3M6.5 15.5h3" />
    </>
  ),
  chat: <path d="M5 6.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7l-4.5 3.5V17.5H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />,
  crown: <path d="m3.5 8 4.5 4 4-7 4 7 4.5-4-2 11h-13l-2-11Z" />,
  headphones: (
    <>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect x="3.5" y="14" width="4" height="6" rx="1.5" />
      <rect x="16.5" y="14" width="4" height="6" rx="1.5" />
    </>
  ),
  download: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14" />,
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m20 16-5-5-8.5 8.5" />
    </>
  ),
  spark: <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7L4.5 11 10.1 9 12 3.5ZM19 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />,
  list: <path d="M8 6h12M8 12h12M8 18h8M4 6h.01M4 12h.01M4 18h.01" />,
  shuffle: <path d="M4 7h3.5c4.5 0 4.5 10 9 10H20m0 0-2.5-2.5M20 17l-2.5 2.5M4 17h3.5c1.4 0 2.3-.9 3-2.1M20 7h-3.5c-1.4 0-2.3.9-3 2.1M20 7l-2.5-2.5M20 7l-2.5 2.5" />,
  repeat: <path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19m0 0-2.5-2.5M19 6l-2.5 2.5M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5m0 0 2.5 2.5M5 18l2.5-2.5" />,
  repeatOne: (
    <>
      <path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19m0 0-2.5-2.5M19 6l-2.5 2.5M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5m0 0 2.5 2.5M5 18l2.5-2.5" />
      <path d="M11.5 10.5 12.5 10v4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l11-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  refresh: <path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5" />,
  trash: <path d="M5 7h14M10 4h4M7 7l1 13h8l1-13M10.5 11v5M13.5 11v5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lyric: <path d="M4 6h16M4 10h11M4 14h16M4 18h8" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  arrowUp: <path d="M12 19V5m0 0-5 5m5-5 5 5" />,
  arrowDown: <path d="M12 5v14m0 0-5-5m5 5 5-5" />,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
