import { APP_VERSION, CONTACT_EMAIL, PRODUCT } from '../lib/site'

export function AboutPage() {
  return (
    <>
      <div className="about-grid">
        <article className="prose-card">
          <p className="kicker">关于</p>
          <h1>{PRODUCT}</h1>
          <p>
            这里是一处轻轻的听歌处。你可以寻一句歌词，或一个忽然想起的名字，让旋律在指尖慢慢展开。想再听一遍，就停在这一首；想一路听下去，就交给列表；也可以把顺序交给偶然。最近听过的歌会留下来，正在播放的名单也随时可以翻开。愿每一首都成为一段温柔的停留。
          </p>
          <p>顶部搜索可以按歌名或歌手找歌。歌单、榜单和专辑是编辑整理的入口。</p>
        </article>
        <aside className="fact-card">
          <div>
            <span>名称</span>
            <strong>{PRODUCT}</strong>
          </div>
          <div>
            <span>播放器版本</span>
            <strong>{APP_VERSION}</strong>
          </div>
          <div>
            <span>官网</span>
            <strong>1.0.0</strong>
          </div>
          <div>
            <span>邮箱</span>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
        </aside>
      </div>
    </>
  )
}
