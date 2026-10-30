import type { SongComment } from '../lib/comment'
import { formatCount } from '../lib/format'
import { Icon } from './Icon'
import { Avatar } from './PostCard'

/** 热评、歌单评论这类不带楼中楼的平铺列表。 */
export function CommentList({ items }: { items: SongComment[] }) {
  return (
    <ul className="flat-comments">
      {items.map((item) => (
        <li key={item.id}>
          <Avatar src={item.avatar} name={item.user} />
          <div>
            <div className="flat-comment-head">
              <strong>{item.user}</strong>
              {item.time ? <time>{item.time}</time> : null}
            </div>
            <p>{item.text}</p>
            <span className="flat-comment-likes">
              <Icon name="heart" size={13} />
              {formatCount(item.likes)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
