import { useEffect, useRef, useState } from 'react'
import { AlbumCard } from '../components/AlbumCard'
import { CoverArt } from '../components/CoverArt'
import { PlaylistGrid } from '../components/PlaylistGrid'
import { usePlayer } from '../components/PlayerProvider'
import { SectionHead } from '../components/SectionHead'
import { albums, banners, charts, EDITORIAL_NOTE, getTracks, playlists } from '../data/catalog'

function Banner() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % banners.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [paused])

  return (
    <section
      className="banner"
      aria-roledescription="carousel"
      aria-label="推荐"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {banners.map((banner, i) => {
        const btnClass = banner.tone === 'sand' ? 'btn' : 'btn btn-light'
        return (
          <div
            key={banner.id}
            className={`banner-slide tone-${banner.tone}${i === index ? ' is-on' : ''}`}
            aria-hidden={i !== index}
          >
            <div className="banner-copy">
              <p className="kicker">{banner.kicker}</p>
              <h2>{banner.title}</h2>
              <p>{banner.text}</p>
              <a className={btnClass} href={banner.href}>
                {banner.action}
              </a>
            </div>
            <div className="banner-disc" aria-hidden="true" />
          </div>
        )
      })}
      <button
        type="button"
        className="banner-arrow prev"
        aria-label="上一张"
        onClick={() => setIndex((value) => (value + banners.length - 1) % banners.length)}
      >
        ‹
      </button>
      <button
        type="button"
        className="banner-arrow next"
        aria-label="下一张"
        onClick={() => setIndex((value) => (value + 1) % banners.length)}
      >
        ›
      </button>
      <div className="banner-dots">
        {banners.map((banner, i) => (
          <button
            key={banner.id}
            type="button"
            className={i === index ? 'on' : ''}
            aria-label={`第 ${i + 1} 张`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  )
}

function AlbumScroller() {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }
  return (
    <div className="album-frame">
      <button type="button" className="album-nav prev" aria-label="向左" onClick={() => scroll(-1)}>
        ‹
      </button>
      <div className="album-scroller" ref={ref}>
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
      <button type="button" className="album-nav next" aria-label="向右" onClick={() => scroll(1)}>
        ›
      </button>
    </div>
  )
}

export function DiscoverPage() {
  const { playNamed, warmNamed, pending } = usePlayer()
  return (
    <>
      <h1 className="sr-only">发现音乐</h1>
      <div className="home-top">
        <Banner />
        <aside className="client-card">
          <p className="kicker">聆听</p>
          <h2>jun.sun</h2>
          <p>搜一个歌名，或一个忽然想起的名字。</p>
          <a className="btn btn-light" href="#/search">
            搜索歌曲
          </a>
        </aside>
      </div>

      <section>
        <SectionHead title="热门推荐" more="#/playlists" />
        <PlaylistGrid items={playlists} />
      </section>

      <section>
        <SectionHead title="新碟上架" more="#/albums" />
        <AlbumScroller />
      </section>

      <section>
        <SectionHead title="编辑榜单" more="#/toplist" />
        <div className="billboard">
          {charts.map((chart) => (
            <div key={chart.id} className="bill-col">
              <div
                className="bill-head"
                style={{ background: `linear-gradient(145deg, ${chart.cover.from}, ${chart.cover.to})` }}
              >
                <CoverArt cover={chart.cover} size="sm" />
                <div>
                  <a href={`#/toplist/${chart.id}`}>{chart.title}</a>
                  <span>{chart.trackIds.length} 首</span>
                </div>
              </div>
              {getTracks(chart.trackIds).map((track, index) => (
                <div key={track.id} className="bill-row">
                  <span className={index < 3 ? 'rank top' : 'rank'}>{index + 1}</span>
                  <span className="bill-title">{track.title}</span>
                  <span className="bill-artist">{track.artist}</span>
                  <span className="bill-actions">
                    <button
                      type="button"
                      className="text-btn"
                      disabled={pending}
                      onPointerDown={() => warmNamed(track.title, track.artist, 'audio')}
                      onClick={() => playNamed(track.title, track.artist, 'audio')}
                    >
                      播放歌曲
                    </button>
                    <button
                      type="button"
                      className="text-btn"
                      disabled={pending}
                      onPointerDown={() => warmNamed(track.title, track.artist, 'mv')}
                      onClick={() => playNamed(track.title, track.artist, 'mv')}
                    >
                      播放MV
                    </button>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="note">{EDITORIAL_NOTE}</p>
      </section>
    </>
  )
}
