import { useEffect, useState } from 'react'
import { Icon } from './Icon'

type Props = {
  src?: string
  alt?: string
  className?: string
  eager?: boolean
}

/** 远端封面：加载失败时换成品牌色占位，不留破图。 */
export function Cover({ src, alt = '', className = '', eager = false }: Props) {
  const [broken, setBroken] = useState(false)

  useEffect(() => setBroken(false), [src])

  if (!src || broken) {
    return (
      <span className={`cover-fallback ${className}`} aria-hidden="true">
        <Icon name="music" size={22} />
      </span>
    )
  }
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onError={() => setBroken(true)}
    />
  )
}
