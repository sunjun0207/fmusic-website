import { FALLBACK_KEYWORDS } from '../../data/brand'
import { formatCount } from '../../lib/format'
import { fetchArtists, fetchHotKeywords } from '../../lib/kuwo'
import { listenLevel } from '../../lib/level'
import { getFavorites, getMyPlaylists, getNickname, getPlayStats } from '../../lib/library'
import { searchHash } from '../../lib/route'
import { coverUrl } from '../../lib/search'
import { useLibraryVersion } from '../../lib/useLibrary'
import { useRemote } from '../../lib/useRemote'
import { Cover } from '../Cover'
import { LoadingState } from '../EmptyState'
import { Icon } from '../Icon'

function ProfileCard() {
  useLibraryVersion()
  const nickname = getNickname()
  const plays = getPlayStats().count
  const level = listenLevel(plays)
  const stats = [
    { label: '收藏', value: getFavorites().length, href: '#/mine' },
    { label: '歌单', value: getMyPlaylists().length, href: '#/mine?tab=lists' },
    { label: '播放', value: plays, href: '#/mine?tab=recent' },
  ]
  return (
    <section className="aside-card profile-card">
      <div className="profile-head">
        <span className="profile-avatar">
          <Icon name="headphones" size={22} />
        </span>
        <div>
          <strong>{nickname || '音浪新朋友'}</strong>
          <span className="level-badge">
            Lv.{level.level} {level.title}
          </span>
        </div>
      </div>
      <div className="profile-stats">
        {stats.map((item) => (
          <a key={item.label} href={item.href}>
            <strong>{formatCount(item.value)}</strong>
            <span>{item.label}</span>
          </a>
        ))}
      </div>
      <a className="btn btn-block" href="#/mine">
        进入我的音乐宇宙
      </a>
      {nickname ? null : (
        <a className="profile-tip" href="#/vip">
          给自己起个昵称，让音浪记住你
          <Icon name="chevronRight" size={14} />
        </a>
      )}
    </section>
  )
}

function HotArtists() {
  const remote = useRemote('artist:list:0:1:8', () => fetchArtists('0', 1, 8))
  return (
    <section className="aside-card">
      <div className="aside-head">
        <h2>热门歌手</h2>
        <a href="#/artists">全部</a>
      </div>
      {!remote.data ? (
        remote.error ? (
          <p className="aside-note">{remote.error}</p>
        ) : (
          <LoadingState compact />
        )
      ) : (
        <ul className="aside-artists">
          {remote.data.list.map((artist) => (
            <li key={artist.id}>
              <a href={`#/artist/${artist.id}`}>
                <Cover className="aside-avatar" src={coverUrl(artist.pic, 'artist')} />
                <span>
                  <strong>{artist.name}</strong>
                  <small>{artist.fans ? `${formatCount(artist.fans)} 粉丝` : `${artist.songCount} 首歌`}</small>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function HotSearch({ limit = 10 }: { limit?: number }) {
  const remote = useRemote('hot-keywords', fetchHotKeywords)
  const words = remote.data?.length ? remote.data : remote.error ? FALLBACK_KEYWORDS : []
  return (
    <section className="aside-card">
      <div className="aside-head">
        <h2>大家都在搜</h2>
        <a href="#/search">去搜索</a>
      </div>
      {words.length ? (
        <ol className="aside-hot">
          {words.slice(0, limit).map((word, index) => (
            <li key={word}>
              <a href={searchHash(word)}>
                <span className={index < 3 ? 'rank is-top' : 'rank'}>{index + 1}</span>
                {word}
                {index < 3 ? <Icon name="fire" size={13} className="hot-fire" /> : null}
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <LoadingState compact />
      )}
    </section>
  )
}

function VipPromo() {
  return (
    <a className="aside-card vip-promo" href="#/vip">
      <span className="vip-promo-badge">
        <Icon name="crown" size={14} />
        SOUNDWAVE CLUB
      </span>
      <strong>不止听见旋律，更要感受热爱。</strong>
      <span>无损音质 · 超清 MV · 歌词弹幕</span>
      <em>公测期间全部免费</em>
    </a>
  )
}

export function HomeAside() {
  return (
    <aside className="home-aside">
      <ProfileCard />
      <VipPromo />
      <HotArtists />
      <HotSearch />
    </aside>
  )
}
