// lib/bible/focusReading.ts
// Focus Reading: bionic-style bold anchors at the start of each word.
// Output is HTML (strong tags), so all text is escaped before wrapping.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function boldCount(len: number): number {
  if (len <= 1) return 1
  if (len === 2) return 1
  if (len <= 4) return 2
  if (len <= 6) return 3
  return Math.ceil(len * 0.4)
}

const VERSE_NUMBER = /^\d{1,3}$/
// Leading punctuation, core, trailing punctuation. Core is anything that is not
// punctuation-only at the edges; letters, digits, apostrophes and hyphens stay inside.
const WORD_PARTS = /^([^\p{L}\p{N}]*)([\p{L}\p{N}].*?[\p{L}\p{N}]|[\p{L}\p{N}])?([^\p{L}\p{N}]*)$/u

function focusWord(word: string): string {
  if (word.length === 0) return word
  if (VERSE_NUMBER.test(word)) return word

  const match = WORD_PARTS.exec(word)
  if (!match || !match[2]) return escapeHtml(word)

  const lead = match[1] ?? ''
  const core = match[2]
  const trail = match[3] ?? ''

  const chars = Array.from(core)
  const n = boldCount(chars.length)
  const boldPart = chars.slice(0, n).join('')
  const restPart = chars.slice(n).join('')

  return `${escapeHtml(lead)}<strong>${escapeHtml(boldPart)}</strong>${escapeHtml(restPart)}${escapeHtml(trail)}`
}

export function applyFocusReading(text: string): string {
  return text.split(' ').map(focusWord).join(' ')
}

export function applyFocusReadingToVerses(
  verses: { number: number; text: string }[]
): { number: number; text: string; html: string }[] {
  return verses.map((v) => ({ ...v, html: applyFocusReading(v.text) }))
}
