import type { ReactNode } from 'react'
import { Icon } from './Icon'

type Props = {
  title: string
  en?: string
  desc?: string
  more?: string
  moreLabel?: string
  children?: ReactNode
}

export function SectionHead({ title, en, desc, more, moreLabel = '更多', children }: Props) {
  return (
    <div className="section-head">
      <div className="section-title">
        <h2>
          {title}
          {en ? <small>{en}</small> : null}
        </h2>
        {desc ? <p>{desc}</p> : null}
      </div>
      {children ? <div className="section-extra">{children}</div> : null}
      {more ? (
        <a className="section-more" href={more}>
          {moreLabel}
          <Icon name="chevronRight" size={14} />
        </a>
      ) : null}
    </div>
  )
}
