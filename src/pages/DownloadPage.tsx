import { Icon, type IconName } from '../components/Icon'
import { PageHero } from '../components/PageHero'
import { SectionHead } from '../components/SectionHead'

const features: { icon: IconName; title: string; text: string }[] = [
  { icon: 'search', title: '搜一首歌', text: '按歌名、歌手或专辑找歌，输入时会有联想，搜过的词会留在历史里。' },
  { icon: 'lyric', title: '跟着唱', text: '点开播放条上的封面进入歌词页，歌词跟着时间走，还能看热评弹幕。' },
  { icon: 'shuffle', title: '播放方式', text: '列表循环、单曲循环，或者把顺序交给随机。' },
  { icon: 'list', title: '播放列表', text: '正在听的名单随时翻开，从里面换一首。' },
  { icon: 'heart', title: '收藏与歌单', text: '小爱心把歌收进「我的音乐宇宙」，「+」把歌加进你的专属歌单。' },
  { icon: 'download', title: '下载保存', text: '歌曲和 MV 都能保存，文件名会带上音质；封面大图也可以保存。' },
]

const qualities = [
  { title: '标准', spec: '128K MP3', text: '流量更省，通勤路上够用。' },
  { title: '高品', spec: '320K MP3', text: '日常听歌的默认选择。' },
  { title: '无损', spec: 'FLAC', text: '想把每个细节听全的时候再用。' },
]

export function DownloadPage() {
  return (
    <>
      <PageHero copy={{ en: 'HOW TO LISTEN', title: '戴上耳机，世界都是你的。', desc: '不用下载客户端，打开浏览器就能听：搜歌、看歌词、看 MV、选音质，一站搞定。' }}>
        <a className="btn btn-lg" href="#/daily">
          <Icon name="play" size={18} />
          立即听歌
        </a>
        <a className="btn btn-lg btn-ghost" href="#/search">
          搜一首歌
        </a>
      </PageHero>

      <section className="page-section">
        <SectionHead title="能做什么" en="FEATURES" />
        <div className="perk-grid">
          {features.map((item) => (
            <article key={item.title} className="perk-card">
              <span className="perk-icon">
                <Icon name={item.icon} size={22} />
              </span>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section">
        <SectionHead title="音质" en="QUALITY" desc="播放条上的「音质」可以随时切换，下载时文件名会带上所选音质。" />
        <div className="quality-grid">
          {qualities.map((item) => (
            <article key={item.spec} className="quality-card">
              <h3>{item.title}</h3>
              <p className="spec">{item.spec}</p>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
