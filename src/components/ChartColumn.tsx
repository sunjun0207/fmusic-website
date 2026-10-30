import { fetchChartSongs, type ChartInfo } from '../lib/kuwo'
import { coverUrl } from '../lib/search'
import { useRemote } from '../lib/useRemote'
import { Cover } from './Cover'
import { ErrorState, LoadingState } from './EmptyState'
import { Icon } from './Icon'
import { artistHref } from './SongList'
import { usePlayAll } from './usePlayAll'
import { usePlayer } from './PlayerProvider'

/** 首页三栏榜单：榜单头 + 前十名，像网易云首页的「榜单」区。 */
export function ChartColumn({ chart }: { chart: ChartInfo }) {
  const player = usePlayer()
  const { busy, start } = usePlayAll()
  const remote = useRemote(`chart:${chart.id}:1:30`, () => fetchChartSongs(chart.id, 1, 30))
  const songs = remote.data?.songs ?? []

  return (
    <section className="chart-col">
      <header className="chart-col-head">
        <a className="chart-col-cover" href={`#/toplist/${chart.id}`} tabIndex={-1}>
          <Cover src={coverUrl(chart.pic)} alt="" />
        </a>
        <div>
          <a href={`#/toplist/${chart.id}`}>
            <h3>{chart.name}</h3>
          </a>
          <span>{remote.data?.pub || chart.pub || '每日更新'}</span>
          <button
            type="button"
            className="btn btn-sm"
            disabled={busy !== '' || !songs.length}
            onClick={() => void start(chart.id, () => songs)}
          >
            <Icon name="play" size={14} />
            播放全部
          </button>
        </div>
      </header>
      {remote.error ? (
        <ErrorState text={remote.error} onRetry={remote.reload} />
      ) : !remote.data ? (
        <LoadingState compact />
      ) : (
        <ol className="chart-col-list">
          {songs.slice(0, 10).map((song, index) => (
            <li key={song.id} className={player.playingId === song.id ? 'is-playing' : undefined}>
              <span className={index < 3 ? 'rank is-top' : 'rank'}>{index + 1}</span>
              <a className="chart-col-name" href={`#/song/${song.id}`} title={song.title}>
                {song.title}
              </a>
              <a className="chart-col-artist" href={artistHref(song)}>
                {song.artist}
              </a>
              <button
                type="button"
                className="op-btn"
                aria-label={`播放这首歌：${song.title}`}
                title="播放这首歌"
                onPointerDown={() => player.warm(song)}
                onClick={() => player.play(song, 'audio', songs)}
              >
                <Icon name="play" size={14} />
              </button>
            </li>
          ))}
        </ol>
      )}
      <a className="chart-col-more" href={`#/toplist/${chart.id}`}>
        查看全部
        <Icon name="chevronRight" size={14} />
      </a>
    </section>
  )
}
