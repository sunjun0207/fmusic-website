import { Icon } from '../components/Icon'
import { PageHero, WaveArt } from '../components/PageHero'
import { SectionHead } from '../components/SectionHead'
import { StationCard, toneStyle, useTuner } from '../components/StationCard'
import { PAGE_COPY, STATIONS, stationForHour, type Station } from '../data/brand'
import { favoriteArtists } from '../lib/daily'
import { privateSongs } from '../lib/radio'

type Slot = { station: Station; from: number; to: number }

/** 把 24 小时按电台连成时段：05:00 起排，跨午夜的深夜档算一段。 */
function schedule(): Slot[] {
  const slots: Slot[] = []
  for (let step = 0; step < 24; step += 1) {
    const hour = (step + 5) % 24
    const station = stationForHour(hour)
    const last = slots[slots.length - 1]
    if (last && last.station.id === station.id) last.to = hour
    else slots.push({ station, from: hour, to: hour })
  }
  return slots
}

const pad = (hour: number) => `${String(hour).padStart(2, '0')}:00`

export function RadioPage() {
  const tuner = useTuner()
  const hour = new Date().getHours()
  const now = stationForHour(hour)
  const basis = favoriteArtists(3)

  return (
    <>
      <PageHero copy={PAGE_COPY.radio} />
      <div className="radio-top">
        <article className={tuner.onAir === now.id ? 'on-air-card is-on-air' : 'on-air-card'} style={toneStyle(now.tone)}>
          <WaveArt className="on-air-wave" />
          <p className="eyebrow">ON AIR · {pad(hour)} 此刻推荐</p>
          <h2>{now.name}</h2>
          <p>{now.slogan}</p>
          <button type="button" className="btn btn-lg btn-light" disabled={tuner.busy !== ''} onClick={() => void tuner.tuneStation(now)}>
            {tuner.busy === now.id ? <span className="spinner" aria-hidden="true" /> : <Icon name="play" size={18} />}
            {tuner.busy === now.id ? '正在调频…' : tuner.onAir === now.id ? '换一批' : '开始收听'}
          </button>
        </article>
        <article className={tuner.onAir === 'private' ? 'on-air-card is-private is-on-air' : 'on-air-card is-private'}>
          <WaveArt className="on-air-wave" />
          <p className="eyebrow">JUST FOR YOU · 私人专属</p>
          <h2>私人专属电台</h2>
          <p>{basis.length ? `懂你的音乐品味：${basis.join('、')}，也懂你此刻的心情。` : '懂你的音乐品味，也懂你此刻的心情。听得越多，它越懂你。'}</p>
          <button type="button" className="btn btn-lg btn-light" disabled={tuner.busy !== ''} onClick={() => void tuner.tune('private', '私人专属电台', privateSongs)}>
            {tuner.busy === 'private' ? <span className="spinner" aria-hidden="true" /> : <Icon name="play" size={18} />}
            {tuner.busy === 'private' ? '正在调频…' : tuner.onAir === 'private' ? '换一批' : '开始收听'}
          </button>
        </article>
      </div>

      <section className="page-section">
        <SectionHead title="全部电台" en="STATIONS" desc="每个电台都从对应分类的热门歌单里现挑现播，每次收听都不一样。" />
        <div className="station-grid">
          {STATIONS.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              live={station.id === now.id}
              onAir={tuner.onAir === station.id}
              busy={tuner.busy === station.id}
              onTune={() => void tuner.tuneStation(station)}
            />
          ))}
        </div>
      </section>

      <section className="page-section">
        <SectionHead title="今日节目单" en="SCHEDULE" desc="从清晨到深夜，每个时段都有一段旋律陪着你。" />
        <ol className="schedule">
          {schedule().map((slot) => {
            const live = slot.station.id === now.id
            return (
              <li key={`${slot.from}-${slot.station.id}`} className={live ? 'is-live' : undefined} style={toneStyle(slot.station.tone)}>
                <span className="schedule-time">
                  {pad(slot.from)} – {pad((slot.to + 1) % 24)}
                </span>
                <strong>{slot.station.name}</strong>
                <span className="schedule-slogan">{slot.station.slogan}</span>
                {live ? <span className="live-badge">正在播出</span> : null}
              </li>
            )
          })}
        </ol>
      </section>
    </>
  )
}
