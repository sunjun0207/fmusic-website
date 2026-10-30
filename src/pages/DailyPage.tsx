import { Icon } from '../components/Icon'
import { PageHero } from '../components/PageHero'
import { Remote } from '../components/Remote'
import { SongList } from '../components/SongList'
import { usePlayAll } from '../components/usePlayAll'
import { PAGE_COPY } from '../data/brand'
import { getDailyMix } from '../lib/daily'
import { weekday } from '../lib/format'
import { dayKey } from '../lib/random'
import { useRemote } from '../lib/useRemote'

export function DailyPage() {
  const remote = useRemote(`daily:${dayKey()}`, getDailyMix)
  const { busy, start } = usePlayAll()
  const today = new Date()
  const mix = remote.data

  return (
    <>
      <PageHero copy={PAGE_COPY.daily}>
        <div className="date-chip">
          <strong>{today.getDate()}</strong>
          <span>
            {today.getMonth() + 1} 月 · {weekday(today)}
          </span>
        </div>
        <button type="button" className="btn btn-lg" disabled={busy !== '' || !mix} onClick={() => void start('daily', () => mix?.songs ?? [])}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="play" size={18} />}
          播放全部
        </button>
      </PageHero>
      <section className="panel">
        <div className="list-head">
          <h2>
            今日推荐
            <small>{mix ? `${mix.songs.length} 首 · 每天 0 点更新` : '每天 0 点更新'}</small>
          </h2>
          {mix ? (
            <p className="list-note">
              <Icon name="spark" size={14} />
              {mix.basis.length ? `根据你常听的 ${mix.basis.join('、')}，混进今天的热歌、飙升和新歌。` : '你还没有听歌记录，先从大家都在听的开始；收藏和播放得越多，推荐越懂你。'}
            </p>
          ) : null}
        </div>
        <Remote remote={remote}>{(data) => <SongList songs={data.songs} />}</Remote>
      </section>
    </>
  )
}
