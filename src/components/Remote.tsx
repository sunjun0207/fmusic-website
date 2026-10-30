import type { ReactNode } from 'react'
import { EmptyState, ErrorState, LoadingState } from './EmptyState'

type RemoteLike<T> = { data?: T; error: string; missing?: boolean; reload: () => void }

/** 远端数据的三态：有数据就渲染，失败给重试，其余显示加载中。 */
export function Remote<T>({ remote, children, compact }: { remote: RemoteLike<T>; children: (data: T) => ReactNode; compact?: boolean }) {
  if (remote.data !== undefined) return <>{children(remote.data)}</>
  if (remote.missing) return <EmptyState title={remote.error} hint="可能已经下架或被删除了，去发现页看看别的吧。" href="#/discover" action="去发现音乐" />
  if (remote.error) return <ErrorState text={remote.error} onRetry={remote.reload} />
  return <LoadingState compact={compact} />
}
