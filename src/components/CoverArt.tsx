import type { Cover } from '../data/catalog'

type Props = {
  cover: Cover
  round?: boolean
  size?: 'sm' | 'md'
}

export function CoverArt({ cover, round = false, size = 'md' }: Props) {
  const cls = `cover${round ? ' round' : ''}${size === 'sm' ? ' cover-sm' : ''}`
  return (
    <div
      className={cls}
      style={{ background: `linear-gradient(145deg, ${cover.from}, ${cover.to})` }}
      aria-hidden="true"
    >
      <span className="cover-mark">{cover.mark}</span>
    </div>
  )
}
