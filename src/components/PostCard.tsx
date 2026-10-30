import { useState } from 'react'
import type { WallPost } from '../lib/community'
import { formatCount } from '../lib/format'
import { thumbUrl } from '../lib/search'
import { Cover } from './Cover'
import { Icon } from './Icon'
import { usePlayer } from './PlayerProvider'

export function Avatar({ src, name }: { src: string; name: string }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken) return <span className="avatar is-text">{name.slice(0, 1) || '听'}</span>
  return <img className="avatar" src={src.replace(/^http:/, 'https:')} alt="" loading="lazy" onError={() => setBroken(true)} />
}

/** 社区评论卡片：一条真实热评 + 它来自的那首歌。 */
export function PostCard({ post, queue }: { post: WallPost; queue?: WallPost[] }) {
  const player = usePlayer()
  const { song, comment } = post
  const playing = player.playingId === song.id
  return (
    <article className={playing ? 'post-card is-playing' : 'post-card'}>
      <header className="post-user">
        <Avatar src={comment.avatar} name={comment.user} />
        <div>
          <strong>{comment.user}</strong>
          {comment.time ? <span>{comment.time}</span> : null}
        </div>
        <span className="post-likes" title="点赞数">
          <Icon name="heartFill" size={13} />
          {formatCount(comment.likes)}
        </span>
      </header>
      <p className="post-text">{comment.text}</p>
      <div className="post-song">
        <Cover className="post-cover" src={thumbUrl(song.image)} />
        <a href={`#/song/${song.id}`}>
          <strong>{song.title}</strong>
          <span>{song.artist}</span>
        </a>
        <button
          type="button"
          className="op-btn"
          aria-label={`播放这首歌：${song.title}`}
          title="播放这首歌"
          onPointerDown={() => player.warm(song)}
          onClick={() => player.play(song, 'audio', queue ? [...new Map(queue.map((item) => [item.song.id, item.song])).values()] : undefined)}
        >
          <Icon name={playing ? 'wave' : 'play'} size={16} />
        </button>
      </div>
    </article>
  )
}
