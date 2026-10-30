import { LogoMark } from '../components/Logo'
import { WaveArt } from '../components/PageHero'
import { BRAND_STORY, KEYWORDS, SLOGANS } from '../data/brand'
import { APP_VERSION, CONTACT_EMAIL, MOTTO, PRODUCT, SITE_VERSION, SLOGAN } from '../lib/site'

const PILLARS = [
  { title: '音乐发现', text: '热门新歌、宝藏歌曲、小众音乐，每一次打开都有新的惊喜。' },
  { title: '情绪共鸣', text: '治愈、热爱、孤独、快乐、自由，让每一种情绪都有专属 BGM。' },
  { title: '个性推荐', text: '每日推荐和私人电台跟着你的收藏与播放走，越听越懂你。' },
  { title: '音乐社交', text: '乐评墙、听友歌单、一键分享，因为一首歌认识有趣的人。' },
]

export function AboutPage() {
  return (
    <>
      <header className="about-hero">
        <WaveArt />
        <LogoMark size={64} />
        <p className="eyebrow">{MOTTO}</p>
        <h1>
          音浪 <span className="gradient-text">SOUNDWAVE</span>
        </h1>
        <p className="about-slogan">{SLOGAN}</p>
        <p>听见热爱 · 遇见共鸣。一个发现好音乐、分享好心情、遇见同频灵魂的音乐世界。</p>
      </header>

      <section className="pillar-grid">
        {PILLARS.map((item) => (
          <article key={item.title} className="pillar">
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <div className="about-grid">
        <article className="panel prose-card">
          <p className="eyebrow">OUR STORY</p>
          <h2>{BRAND_STORY.title}</h2>
          {BRAND_STORY.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p className="brand-band-sign">{BRAND_STORY.sign}</p>
          <div className="chip-row">
            {KEYWORDS.map((word) => (
              <span key={word} className="chip is-static">
                {word}
              </span>
            ))}
          </div>
          <ul className="slogan-list">
            {SLOGANS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </article>
        <aside className="panel fact-card">
          <div>
            <span>品牌</span>
            <strong>{PRODUCT}</strong>
          </div>
          <div>
            <span>官网版本</span>
            <strong>{SITE_VERSION}</strong>
          </div>
          <div>
            <span>播放器版本</span>
            <strong>{APP_VERSION}</strong>
          </div>
          <div>
            <span>数据来源</span>
            <strong>酷我音乐公开接口</strong>
          </div>
          <div>
            <span>联系我们</span>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
        </aside>
      </div>
    </>
  )
}
