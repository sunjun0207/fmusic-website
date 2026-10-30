import { EmptyState } from '../components/EmptyState'

export function NotFoundPage() {
  return <EmptyState title="这一页走丢了，音乐还在。" hint="地址可能写错了，回首页挑一首喜欢的歌吧。" href="#/home" action="回到首页" />
}
