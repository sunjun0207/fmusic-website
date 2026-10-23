type Props = {
  title: string
  hint?: string
  href?: string
  action?: string
}

export function EmptyState({ title, hint, href, action }: Props) {
  return (
    <div className="empty">
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
