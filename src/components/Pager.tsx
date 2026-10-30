function pagerPages(current: number, totalPages: number) {
  const wanted = new Set<number>([1, totalPages])
  for (let n = current - 2; n <= current + 2; n += 1) wanted.add(n)
  return [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
}

type Props = {
  page: number
  totalPages: number
  hrefFor: (page: number) => string
  label: string
}

export function Pager({ page, totalPages, hrefFor, label }: Props) {
  if (totalPages <= 1) return null
  const pages = pagerPages(page, totalPages)
  return (
    <nav className="pager" aria-label={label}>
      {page <= 1 ? <span className="is-disabled">上一页</span> : <a href={hrefFor(page - 1)}>上一页</a>}
      {pages.map((n, index) => {
        const prev = pages[index - 1]
        const gap = prev && n - prev > 1
        return (
          <span key={n} className="pager-slot">
            {gap ? <span className="pager-gap">…</span> : null}
            <a href={hrefFor(n)} aria-current={n === page ? 'page' : undefined}>
              {n}
            </a>
          </span>
        )
      })}
      {page >= totalPages ? <span className="is-disabled">下一页</span> : <a href={hrefFor(page + 1)}>下一页</a>}
    </nav>
  )
}
