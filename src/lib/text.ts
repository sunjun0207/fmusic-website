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
    const next = text
      .replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (all, body: string) => {
        if (body[0] === '#') {
          const code =
            body[1] === 'x' || body[1] === 'X' ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10)
          const char = fromCode(code)
          return char || all
        }
        return NAMED_ENTITIES[body.toLowerCase()] ?? all
      })
      .replace(
        /&(nbsp|amp|apos|quot|lt|gt|ldquo|rdquo|lsquo|rsquo|hellip|mdash|ndash|middot)(?![;a-zA-Z])/gi,
        (all, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? all,
      )
      .replace(/&#x([0-9a-fA-F]{2,6})(?![;0-9a-fA-F])/gi, (all, hex: string) => fromCode(Number.parseInt(hex, 16)) || all)
      .replace(/&#(\d{2,6})(?![;\d])/g, (all, num: string) => fromCode(Number(num)) || all)
    if (next === text) break
    text = next
  }
  return text
}

function tidySeparators(value: string) {
  return value.replace(/([\u3400-\u9fff])\s*[&＆+＋/／|｜]\s*(?=[\u3400-\u9fff])/g, '$1、')
}

export function plainText(value: unknown) {
  let text = decodeEntities(decodePercent(decodeUnicodeEscapes(String(value ?? ''))))
  text = decodeEntities(text.replace(/<\d+\s*,\s*\d+\s*,\s*\d+>/g, '').replace(/<[^>]*>/g, ''))
  return tidySeparators(
    text
      .replace(/###/g, '、')
      .replace(/\\+(?=\S)/g, '')
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
      .replace(/[\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/g, '')
      .replace(/[\u00a0\u3000]/g, ' ')
      .replace(/[\r\n]+/g, ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .trim(),
  )
}
