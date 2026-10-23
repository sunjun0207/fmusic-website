import { CONTACT_EMAIL, PRODUCT } from '../lib/site'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <p className="footer-brand">jun.sun</p>
          <p>把喜欢的歌，慢慢听完。</p>
        </div>
        <div>
          <h2>发现音乐</h2>
          <ul>
            <li>
              <a href="#/discover">推荐</a>
            </li>
            <li>
              <a href="#/toplist">排行榜</a>
            </li>
            <li>
              <a href="#/playlists">歌单</a>
            </li>
            <li>
              <a href="#/artists">歌手</a>
            </li>
            <li>
              <a href="#/albums">新碟上架</a>
            </li>
          </ul>
        </div>
        <div>
          <h2>关于</h2>
          <ul>
            <li>
              <a href="#/about">关于 {PRODUCT}</a>
            </li>
            <li>
              <a href="#/download">听歌说明</a>
            </li>
          </ul>
        </div>
        <div>
          <h2>联系</h2>
          <ul>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </li>
            <li>
              <a href="#/search">站内搜索</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© 2026 {PRODUCT}</span>
        <span>歌曲名与歌手名仅作搜索引导，官网不托管音频。</span>
      </div>
    </footer>
  )
}
