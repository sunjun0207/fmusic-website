const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  middot: '·',
}

function fromCode(code: number) {
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return ''
  if (code >= 0xd800 && code <= 0xdfff) return ''
  return String.fromCodePoint(code)
}

function decodeUnicodeEscapes(value: string) {
  let text = value
  for (let i = 0; i < 4; i += 1) {
    const next = text.replace(/\\+u([0-9a-fA-F]{4})/g, (_, hex: string) => fromCode(Number.parseInt(hex, 16)))
    if (next === text) break
    text = next
  }
  return text
}

function decodePercent(value: string) {
  let text = value
  for (let i = 0; i < 2; i += 1) {
    if (!/%[0-9a-fA-F]{2}/.test(text)) break
    try {
      const next = decodeURIComponent(text.replace(/\+/g, '%20'))
      if (next === text) break
      text = next
    } catch {
      break
    }
  }
  return text
}

function decodeEntities(value: string) {
  let text = value
  for (let i = 0; i < 3; i += 1) {
    const next = text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (all, body: string) => {
      if (body[0] === '#') {
        const code =
          body[1] === 'x' || body[1] === 'X' ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10)
        const char = fromCode(code)
        return char || all
      }
      return NAMED_ENTITIES[body.toLowerCase()] ?? all
    })
    if (next === text) break
    text = next
  }
  return text
}

export function plainText(value: unknown) {
  let text = decodeEntities(decodePercent(decodeUnicodeEscapes(String(value ?? ''))))
  text = decodeEntities(text.replace(/<[^>]*>/g, ''))
  return text
    .replace(/###/g, '、')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}
