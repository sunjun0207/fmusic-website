import type { MusicItem } from './search'
import { PRODUCT } from './site'
import { toast } from './toast'

export function pageLink(hash: string) {
  return `${window.location.origin}${window.location.pathname}${hash}`
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    /* 非安全上下文没有 clipboard，退回到选中复制 */
  }
  const area = document.createElement('textarea')
  area.value = value
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  area.remove()
  return ok
}

/** 手机上走系统分享面板，电脑上直接复制链接。 */
export async function shareLink(title: string, text: string, url: string) {
  const touch = window.matchMedia('(pointer: coarse)').matches
  if (touch && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url })
      return
    } catch (reason: unknown) {
      if (reason instanceof DOMException && reason.name === 'AbortError') return
    }
  }
  const ok = await copyText(`${text} ${url}`)
  toast(ok ? '链接已复制，把这份喜欢分享出去吧' : '没能复制，试试复制地址栏里的链接')
}

export function shareSong(song: MusicItem) {
  return shareLink(song.title, `我在${PRODUCT}听《${song.title}》- ${song.artist}，把这份喜欢分享给你：`, pageLink(`#/song/${song.id}`))
}

export function shareCurrentPage(title: string) {
  return shareLink(title, `在${PRODUCT}发现「${title}」，一起听：`, window.location.href)
}
