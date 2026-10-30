import { useEffect, useMemo, useState } from 'react'
import { favoriteArtists, getDailyMix, peekDailyMix } from '../../lib/daily'
import { weekday } from '../../lib/format'
import { fetchBanners, fetchChartSongs, type BannerItem } from '../../lib/kuwo'
import { coverUrl, withCoverSize } from '../../lib/search'
import { MOTTO } from '../../lib/site'
import { useRemote } from '../../lib/useRemote'
import { Cover } from '../Cover'
import { Icon } from '../Icon'
import { WaveArt } from '../PageHero'
import { usePlayAll } from '../usePlayAll'

type Slide = { kind: 'brand'; id: string } | { kind: 'banner'; id: string; item: BannerItem }

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function BrandSlide() {
  const hot = useRemote('chart:16:1:30', () => fetchChartSongs('16', 1, 30))
  const covers = (hot.data?.songs ?? []).filter((song) => song.image).slice(0, 3)
  const { busy, start } = usePlayAll()

  return (
    <div className="brand-slide">
      <div className="brand-copy">
        <p className="eyebrow">SOUNDWAVE · 音浪</p>
        <h1>
          让音乐，
          <br />
          <span className="gradient-text">点亮</span>每一个瞬间。
        </h1>
        <p>发现好音乐，遇见好心情。在这里，找到属于你的声音，让每一次播放都成为一次新的心动。</p>
        <div className="hero-actions">
          <button type="button" className="btn btn-lg" disabled={busy !== ''} onClick={() => void start('now', () => getDailyMix().then((mix) => mix.songs))}>
            {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="play" size={18} />}
            立即听歌
          </button>
          <a className="btn btn-lg btn-ghost" href="#/discover">
            探索音乐
            <Icon name="chevronRight" size={16} />
          </a>
        </div>
        <p className="brand-motto">{MOTTO}</p>
      </div>
      <div className="brand-art" aria-hidden="true">
        <WaveArt />
        <div className="brand-covers">
          {covers.map((song, index) => (
            <Cover key={song.id} className={`brand-cover is-${index + 1}`} src={withCoverSize(coverUrl(song.image), 300)} eager />
          ))}
        </div>
      </div>
    </div>
  )
}

function DailyCard() {
  const today = new Date()
  const basis = peekDailyMix()?.basis ?? favoriteArtists(3)
  const { busy, start } = usePlayAll()

  return (
    <aside className="daily-card" aria-label="每日推荐">
      <p className="eyebrow">DAILY MIX · 每日推荐</p>
      <div className="daily-date">
        <strong>{today.getDate()}</strong>
        <span>
          {weekday(today)}
          <br />
          {today.getMonth() + 1} 月
        </span>
      </div>
      <h2>今天的心情，交给音乐来安排。</h2>
      <p>{basis.length ? `根据你常听的 ${basis.join('、')}，混进今天的热歌，每天 0 点换新。` : '还不知道你的口味？先从大家都在听的开始，听得越多，越懂你。'}</p>
      <div className="daily-actions">
        <button type="button" className="btn" disabled={busy !== ''} onClick={() => void start('daily', () => getDailyMix().then((mix) => mix.songs))}>
          {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="play" size={16} />}
          播放今日推荐
        </button>
        <a className="btn btn-ghost" href="#/daily">
          查看
        </a>
      </div>
    </aside>
  )
}

export function HomeHero() {
  const banners = useRemote('banner', fetchBanners)
  const slides = useMemo<Slide[]>(
    () => [{ kind: 'brand', id: 'brand' }, ...(banners.data ?? []).slice(0, 6).map((item) => ({ kind: 'banner' as const, id: item.id || item.pic, item }))],
    [banners.data],
  )
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length
  const active = index < count ? index : 0
  const current = slides[active]

  useEffect(() => {
    if (paused || count <= 1 || reduceMotion()) return
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % count), 6500)
    return () => window.clearInterval(timer)
  }, [paused, count])

  const go = (step: number) => setIndex((value) => (value + step + count) % count)
  const backdrop = current?.kind === 'banner' ? withCoverSize(coverUrl(current.item.pic), 300) : ''

  return (
    <section className="home-hero" aria-roledescription="carousel" aria-label="精选推荐">
      <div className={backdrop ? 'hero-backdrop' : 'hero-backdrop is-brand'} style={backdrop ? { backgroundImage: `url("${backdrop}")` } : undefined} />
      <div className="wrap hero-inner">
        <div
          className="hero-stage"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {slides.map((slide, i) => (
            <div key={slide.id} className={i === active ? 'hero-slide is-active' : 'hero-slide'} aria-hidden={i !== active} inert={i !== active}>
              {slide.kind === 'brand' ? (
                <BrandSlide />
              ) : (
                <a className="banner-slide" href={slide.item.href} aria-label={slide.item.title}>
                  <Cover src={coverUrl(slide.item.pic)} alt="" eager={i === 1} />
                  <span className="banner-caption">
                    <em>{slide.item.label}</em>
                    <strong>{slide.item.title}</strong>
                  </span>
                </a>
              )}
            </div>
          ))}
          {count > 1 ? (
            <>
              <button type="button" className="hero-arrow is-prev" aria-label="上一张" onClick={() => go(-1)}>
                <Icon name="chevronLeft" size={20} />
              </button>
              <button type="button" className="hero-arrow is-next" aria-label="下一张" onClick={() => go(1)}>
                <Icon name="chevronRight" size={20} />
              </button>
              <div className="hero-dots">
                {slides.map((slide, i) => (
                  <button key={slide.id} type="button" aria-label={`第 ${i + 1} 张`} aria-current={i === active ? 'true' : undefined} className={i === active ? 'is-active' : undefined} onClick={() => setIndex(i)} />
                ))}
              </div>
            </>
          ) : null}
        </div>
        <DailyCard />
      </div>
    </section>
  )
}
