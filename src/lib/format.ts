export function formatCount(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0'
  if (value >= 1e8) return `${(value / 1e8).toFixed(1).replace(/\.0$/, '')}亿`
  if (value >= 1e4) return `${(value / 1e4).toFixed(value >= 1e6 ? 0 : 1).replace(/\.0$/, '')}万`
  return String(Math.round(value))
}

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

export function weekday(date = new Date()) {
  return WEEKDAYS[date.getDay()] ?? ''
}

/** 「2026-09-30」这种日期在一周内显示成「3 天前」，更像新歌榜的口吻。 */
export function freshDate(value: string) {
  const time = Date.parse(value)
  if (!value || Number.isNaN(time)) return ''
  const days = Math.floor((Date.now() - time) / 86400000)
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  return value
}
