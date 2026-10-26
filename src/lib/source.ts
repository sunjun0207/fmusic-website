/** 与 fmusic-h5 相同：只有 true 走本站代理。本项目默认写 true，保持原来的代理行为。 */
const env = import.meta.env ?? {}
export const useProxy = env.VITE_USE_PROXY === 'true'

export const API_BASE = '/api-fmusic-pomelo7-server'

type Channel = 'search' | 'openapi' | 'img' | 'comment' | 'nmobi'

function directBase(raw: string | undefined, fallback: string): string {
  const base = (raw || fallback).replace(/\/$/, '')
  if (typeof location !== 'undefined' && location.protocol === 'https:' && base.startsWith('http://')) {
    return `https://${base.slice('http://'.length)}`
  }
  return base
}

const DIRECT: Record<Exclude<Channel, 'nmobi'>, string> = {
  search: directBase(env.VITE_KW_SEARCH_TARGET, 'https://search.kuwo.cn'),
  openapi: directBase(env.VITE_KW_OPENAPI_TARGET, 'https://kuwo.cn'),
  img: directBase(env.VITE_KW_IMG_TARGET, 'https://img1.kuwo.cn'),
  comment: directBase(env.VITE_KW_COMMENT_TARGET, 'https://ncomment.kuwo.cn'),
}

const PROXY: Record<Channel, string> = {
  search: `${API_BASE}/kw-search`,
  openapi: `${API_BASE}/kw-openapi`,
  img: `${API_BASE}/kw-img`,
  comment: `${API_BASE}/kw-comment`,
  nmobi: `${API_BASE}/kw-nmobi`,
}

/** 直连歌词。openapi 不回跨域头，这个地址会。 */
export const DIRECT_LYRIC = 'https://m.kuwo.cn/newh5/singles/songinfoandlrc'

/** 和 openapi searchKey 同一份联想词，并且带跨域头。 */
export const DIRECT_SUGGEST = 'https://tips.kuwo.cn/t.s'

export function endpoint(channel: Channel, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  // 播放地址认浏览器标识，直连只会拿到几秒试听。地址查询始终走本站。
  if (channel === 'nmobi' || useProxy) return `${PROXY[channel]}${normalized}`
  return `${DIRECT[channel]}${normalized}`
}

let jsonpSeq = 0

/** 搜索接口没有跨域头，但支持 callback。名字会被服务端转成小写。 */
export function jsonp<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const name = `fwebsitejsonp${Date.now().toString(36)}${jsonpSeq++}`
    const script = document.createElement('script')
    let settled = false
    const timer = window.setTimeout(() => finish(new Error('搜索请求超时')), 15000)
    const finish = (error?: Error, data?: T) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      delete (window as unknown as Record<string, unknown>)[name]
      script.remove()
      if (error) reject(error)
      else resolve(data as T)
    }
    ;(window as unknown as Record<string, (data: T) => void>)[name] = (data) => finish(undefined, data)
    const joiner = url.includes('?') ? '&' : '?'
    script.src = `${url}${joiner}callback=${name}`
    script.async = true
    script.onerror = () => finish(new Error('搜索请求失败'))
    document.head.appendChild(script)
  })
}
