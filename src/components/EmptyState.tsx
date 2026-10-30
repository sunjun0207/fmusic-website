import { NETWORK_TIP } from '../lib/kuwo'
import { Icon } from './Icon'

type Props = {
  title: string
  hint?: string
  href?: string
  action?: string
}

export function EmptyState({ title, hint, href, action }: Props) {
  return (
    <div className="empty">
      <Icon name="music" size={28} />
      <p>{title}</p>
      {hint ? <span>{hint}</span> : null}
      {href && action ? (
        <a
          className="btn"
          href={href}
          {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {action}
        </a>
      ) : null}
    </div>
  )
}

export function LoadingState({ text = '正在为你寻找好声音……', compact = false }: { text?: string; compact?: boolean }) {
  return (
    <div className={`loading-state${compact ? ' is-compact' : ''}`} role="status">
      <span className="eq" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <p>{text}</p>
    </div>
  )
}

export function ErrorState({ text = NETWORK_TIP, onRetry }: { text?: string; onRetry?: () => void }) {
  return (
    <div className="empty is-error" role="alert">
      <Icon name="wave" size={28} />
      <p>{text}</p>
      {onRetry ? (
        <button type="button" className="btn btn-ghost" onClick={onRetry}>
          <Icon name="refresh" size={16} />
          再试一次
        </button>
      ) : null}
    </div>
  )
}
