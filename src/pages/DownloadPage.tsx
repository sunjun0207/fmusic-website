const features = [
  { title: '搜索', text: '按歌名或歌手寻找，输入时会有联想。' },
  { title: '歌词', text: '播放时歌词跟着时间走，方便对着唱。' },
  { title: '播放方式', text: '列表循环、单曲循环，或把顺序交给随机。' },
  { title: '最近播放', text: '听过的歌会留在首页，方便回到上一首。' },
  { title: '播放列表', text: '正在听的名单可以随时翻开，从里面换一首。' },
  { title: '下载记录', text: '下载会记下文件地址，方便再次打开或保存。' },
]

const qualities = [
  { title: '标准', spec: '128K MP3', text: '流量更省，通勤时够用。' },
  { title: '高品', spec: '320K MP3', text: '日常听歌的默认选择。' },
  { title: '无损', spec: 'FLAC', text: '想把细节听全的时候再用。' },
]

export function DownloadPage() {
  return (
    <>
      <section className="dl-hero">
        <div>
          <p className="kicker">聆听</p>
          <h1>在浏览器里，把一首歌听完</h1>
          <p>搜一首歌，看歌词，按列表、单曲或随机听完。音质可以选标准、高品或无损。</p>
        </div>
        <div className="device" aria-hidden="true">
          <div className="device-top">jun.sun</div>
          <div className="device-line">夜曲</div>
          <div className="device-line dim">周杰伦</div>
          <div className="device-bar">
            <span />
          </div>
        </div>
      </section>

      <h2 className="block-title">能做什么</h2>
      <div className="feature-grid">
        {features.map((item) => (
          <article key={item.title} className="feature">
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>

      <h2 className="block-title">音质</h2>
      <div className="quality-grid">
        {qualities.map((item) => (
          <article key={item.spec} className="quality-card">
            <h3>{item.title}</h3>
            <p className="spec">{item.spec}</p>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </>
  )
}
