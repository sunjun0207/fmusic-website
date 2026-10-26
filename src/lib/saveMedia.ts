import { API_BASE } from './api'
import { toProxyMediaUrl } from './play'

function cleanPart(raw: string) {
  return raw
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')
    .slice(0, 60)
}

export function mediaFilename(title: string, artist: string, kind: 'audio' | 'mv', quality = '', extension = '') {
  const name = cleanPart(title) || '未知歌曲'
  const singer = cleanPart(artist) || '未知歌手'
  const mark = quality ? `-${cleanPart(quality)}` : ''
  const ext = extension || (kind === 'mv' ? 'mp4' : 'mp3')
  return `${name}-${singer}${mark}.${ext}`
}

export function pictureFilename(title: string, artist: string, index = 0, total = 1) {
  const name = cleanPart(title) || '未知歌曲'
  const singer = cleanPart(artist) || '未知歌手'
  const mark = total > 1 ? `-${index + 1}` : ''
  return `${name}-${singer}${mark}`
}

function isMedia(bytes: Uint8Array, contentType: string) {
  const ct = contentType.toLowerCase()
  if (ct.includes('text/html') || ct.includes('application/json') || ct.includes('text/plain')) return false
  if (ct.startsWith('audio/') || ct.startsWith('video/')) return true
  if (bytes.length < 4) return false
  const head = String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!)
  if (head.startsWith('ID3') || head === 'fLaC' || head === 'OggS' || head === 'RIFF') return true
  if (bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0) return true
  if (bytes.length >= 8 && String.fromCharCode(bytes[4]!, bytes[5]!, bytes[6]!, bytes[7]!) === 'ftyp') return true
  return false
}

function triggerDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000)
}

function pictureExt(bytes: Uint8Array) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg'
  if (bytes.length >= 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'gif'
  if (
    bytes.length >= 12 &&
    String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!) === 'RIFF' &&
    String.fromCharCode(bytes[8]!, bytes[9]!, bytes[10]!, bytes[11]!) === 'WEBP'
  ) {
    return 'webp'
  }
  return ''
}

function pictureFetchUrl(url: string) {
  if (url.startsWith('/') || url.startsWith(API_BASE)) return url
  const proxied = toProxyMediaUrl(url)
  return proxied.startsWith(`${API_BASE}/`) ? proxied : ''
}

export async function savePicture(url: string, filename: string) {
  const target = pictureFetchUrl(url)
  if (!target) throw new Error('图片地址无效')
  const res = await fetch(target)
  if (!res.ok) throw new Error('图片保存失败')
  const bytes = new Uint8Array(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') ?? ''
  const ext = pictureExt(bytes)
  if (!ext) throw new Error('下载到的不是图片，没有保存')
  triggerDownload(new Blob([bytes], { type: contentType || `image/${ext}` }), `${filename}.${ext}`)
}

export async function saveMedia(url: string, filename: string) {
  const proxyUrl = toProxyMediaUrl(url)
  if (!proxyUrl.startsWith(`${API_BASE}/`)) throw new Error('下载地址无效')
  const res = await fetch(proxyUrl)
  if (!res.ok) throw new Error('下载失败')
  const bytes = new Uint8Array(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') ?? ''
  if (!isMedia(bytes, contentType)) throw new Error('下载到的不是歌曲或视频，没有保存')
  triggerDownload(new Blob([bytes], { type: contentType || 'application/octet-stream' }), filename)
}
