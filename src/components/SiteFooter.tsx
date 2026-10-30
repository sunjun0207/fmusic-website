import { KEYWORDS } from '../data/brand'
import { CONTACT_EMAIL, MOTTO, PRODUCT, SLOGAN } from '../lib/site'
import { Logo } from './Logo'

const COLUMNS = [
  {
    title: '发现音乐',
    links: [
      ['每日推荐', '#/daily'],
      ['排行榜', '#/toplist'],
      ['宝藏歌单', '#/playlists'],
      ['热门歌手', '#/artists'],
      ['新碟上架', '#/albums'],
    ],
  },
  {
    title: '聆听社区',
    links: [
      ['音乐电台', '#/radio'],
      ['音乐社区', '#/community'],
      ['会员中心', '#/vip'],
      ['我的音乐', '#/mine'],
    ],
  },
  {
    title: '关于聆听',
    links: [
      ['品牌故事', '#/about'],
      ['听歌说明', '#/download'],
      ['联系我们', `mailto:${CONTACT_EMAIL}`],
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Logo />
          <p className="footer-slogan">{SLOGAN}</p>
          <p className="footer-motto">{MOTTO}</p>
          <div className="footer-tags">
            {KEYWORDS.map((word) => (
              <span key={word}>{word}</span>
            ))}
          </div>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title} className="footer-col">
            <h2>{column.title}</h2>
            <ul>
              {column.links.map(([label, href]) => (
                <li key={label}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="wrap footer-bottom">
        <span>© 2026 {PRODUCT} · 让热爱持续发声</span>
        <span>曲库内容版权归原作者所有，本站不存储音频。</span>
      </div>
    </footer>
  )
}
