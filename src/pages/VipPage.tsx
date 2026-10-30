import { useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { LogoMark } from '../components/Logo'
import { PageHero } from '../components/PageHero'
import { SectionHead } from '../components/SectionHead'
import { PAGE_COPY, PERKS } from '../data/brand'
import { formatCount } from '../lib/format'
import { listenLevel } from '../lib/level'
import { getFavorites, getMyPlaylists, getNickname, getPlayStats, saveNickname } from '../lib/library'
import { toast } from '../lib/toast'
import { useLibraryVersion } from '../lib/useLibrary'

const FAQ = [
  { q: '会员需要付费吗？', a: '不需要。聆听目前处于公测期，无损音质、超清 MV、下载、歌词弹幕等全部功能向每一位乐迷免费开放，也不需要注册登录。' },
  { q: '我的收藏和歌单存在哪里？', a: '保存在你当前使用的浏览器里。换一台设备、换浏览器或清除网站数据后，这些记录不会跟着走，重要的歌单记得及时记下来。' },
  { q: '听歌等级怎么算？', a: '每开始播放一首歌记一次，累计越多等级越高，从 Lv.1「聆听新人」一路升到 Lv.10「传奇乐迷」。等级只记录在本机。' },
  { q: '为什么有的歌放不了？', a: '少数歌曲因为版权或线路原因暂时无法播放，会提示「音乐暂时走神了，请稍后再试」。换一首，或者过一会儿再来听。' },
]

export function VipPage() {
  useLibraryVersion()
  const nickname = getNickname()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(nickname)
  const stats = getPlayStats()
  const level = listenLevel(stats.count)
  const days = Math.max(1, Math.ceil((Date.now() - stats.since) / 86400000))
  const numbers = [
    { label: '累计播放', value: stats.count, unit: '次' },
    { label: '收藏歌曲', value: getFavorites().length, unit: '首' },
    { label: '自建歌单', value: getMyPlaylists().length, unit: '张' },
    { label: '陪伴天数', value: days, unit: '天' },
  ]

  const save = (event: FormEvent) => {
    event.preventDefault()
    saveNickname(draft.trim())
    setEditing(false)
    toast(draft.trim() ? `你好，${draft.trim()}，欢迎来到聆听` : '已恢复默认昵称')
  }

  return (
    <>
      <PageHero copy={PAGE_COPY.vip} />
      <div className="vip-layout">
        <section className="vip-card" aria-label="会员卡">
          <div className="vip-card-top">
            <LogoMark size={30} />
            <span>JUN.SUN CLUB</span>
            <em>公测会员</em>
          </div>
          {editing ? (
            <form className="vip-name-form" onSubmit={save}>
              <input autoFocus value={draft} maxLength={20} placeholder="给自己起个昵称" aria-label="昵称" onChange={(event) => setDraft(event.target.value)} />
              <button type="submit" className="btn btn-sm btn-light">
                保存
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditing(false)}>
                取消
              </button>
            </form>
          ) : (
            <div className="vip-card-name">
              <strong>{nickname || '聆听新朋友'}</strong>
              <button
                type="button"
                className="text-btn"
                onClick={() => {
                  setDraft(nickname)
                  setEditing(true)
                }}
              >
                {nickname ? '改昵称' : '起个昵称'}
              </button>
            </div>
          )}
          <div className="vip-level">
            <div className="vip-level-text">
              <span>
                Lv.{level.level} {level.title}
              </span>
              <span>{level.next === undefined ? '已满级，你就是传奇' : `再听 ${level.next - stats.count} 首升级`}</span>
            </div>
            <div className="vip-level-bar">
              <i style={{ width: `${Math.round(level.progress * 100)}%` }} />
            </div>
          </div>
          <p className="vip-card-foot">已陪伴你 {days} 天 · 公测期间长期有效</p>
        </section>
        <section className="panel vip-stats">
          {numbers.map((item) => (
            <div key={item.label}>
              <strong>
                {formatCount(item.value)}
                <small>{item.unit}</small>
              </strong>
              <span>{item.label}</span>
            </div>
          ))}
          <a className="btn btn-block" href="#/mine">
            进入我的音乐宇宙
          </a>
        </section>
      </div>

      <section className="page-section">
        <SectionHead title="会员权益" en="PERKS" desc="公测期间，所有权益向每一位乐迷免费开放。" />
        <div className="perk-grid">
          {PERKS.map((perk) => (
            <a key={perk.title} className="perk-card" href={perk.href}>
              <span className="perk-icon">
                <Icon name={perk.icon} size={22} />
              </span>
              <strong>{perk.title}</strong>
              <p>{perk.desc}</p>
              <em>已开通</em>
            </a>
          ))}
        </div>
      </section>

      <section className="page-section">
        <SectionHead title="常见问题" en="FAQ" />
        <div className="faq">
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>
                {item.q}
                <Icon name="chevronRight" size={16} />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
