// lib/bible/aolab.ts
// AO Lab Free Use Bible API — no key, no rate limits, MIT licensed
// Covers KJV, WEB, BSB, ASV, YLT, and 1,000+ others

import type { BibleVersionCode, VerseResult } from '@/types'

const BASE_URL = 'https://api.helloao.org/api'

// Map common book names to AO Lab book IDs
const BOOK_IDS: Record<string, string> = {
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM',
  'Deuteronomy': 'DEU', 'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT',
  '1 Samuel': '1SA', '2 Samuel': '2SA', '1 Kings': '1KI', '2 Kings': '2KI',
  '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR', 'Nehemiah': 'NEH',
  'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA', 'Psalm': 'PSA',
  'Proverbs': 'PRO', 'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG',
  'Song of Songs': 'SNG', 'Isaiah': 'ISA', 'Jeremiah': 'JER',
  'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN', 'Hosea': 'HOS',
  'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON',
  'Micah': 'MIC', 'Nahum': 'NAM', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP',
  'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
  'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN',
  'Acts': 'ACT', 'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO',
  'Galatians': 'GAL', 'Ephesians': 'EPH', 'Philippians': 'PHP',
  'Colossians': 'COL', '1 Thessalonians': '1TH', '2 Thessalonians': '2TH',
  '1 Timothy': '1TI', '2 Timothy': '2TI', 'Titus': 'TIT', 'Philemon': 'PHM',
  'Hebrews': 'HEB', 'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE',
  '1 John': '1JN', '2 John': '2JN', '3 John': '3JN', 'Jude': 'JUD',
  'Revelation': 'REV',
}

interface AoLabVerse {
  number: string
  text: string
}

interface AoLabChapterResponse {
  translation: string
  book: string
  chapter: number
  verses: AoLabVerse[]
}

export async function fetchVerseFromAoLab(
  versionCode: BibleVersionCode,
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number
): Promise<VerseResult> {
  const bookId = BOOK_IDS[book]
  if (!bookId) throw new Error(`Unknown book: "${book}"`)

  const url = `${BASE_URL}/${versionCode}/${bookId}/${chapter}.json`

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 86400 }, // Cache for 24h — Bible text doesn't change
  })

  if (!response.ok) {
    throw new Error(`AO Lab API error ${response.status} for ${versionCode} ${book} ${chapter}`)
  }

  const data: AoLabChapterResponse = await response.json()

  const selected = (data.verses || []).filter((v) => {
    const num = parseInt(v.number, 10)
    return verseEnd ? num >= verseStart && num <= verseEnd : num === verseStart
  })

  if (selected.length === 0) {
    throw new Error(`Verse not found: ${book} ${chapter}:${verseStart} in ${versionCode}`)
  }

  const text = selected.map((v) => v.text.trim()).join(' ')
  const reference =
    verseEnd && verseEnd !== verseStart
      ? `${book} ${chapter}:${verseStart}–${verseEnd}`
      : `${book} ${chapter}:${verseStart}`

  return {
    text,
    reference,
    versionCode,
    versionName: getVersionName(versionCode),
    source: 'aolab',
    usedFallback: false,
    copyrightNotice: null,        // Public domain — no attribution required
    copyrightUrl: null,
    inlineCitation: `— ${reference} (${versionCode})`,
    ragContextBlock: buildRagBlock({ text, reference, versionCode, requiresAttribution: false }),
  }
}

function getVersionName(code: BibleVersionCode): string {
  const names: Record<string, string> = {
    KJV: 'King James Version',
    WEB: 'World English Bible',
    BSB: 'Berean Standard Bible',
    ASV: 'American Standard Version',
    YLT: "Young's Literal Translation",
  }
  return names[code] ?? code
}

function buildRagBlock({
  text, reference, versionCode, requiresAttribution,
}: {
  text: string
  reference: string
  versionCode: string
  requiresAttribution: boolean
}): string {
  return [
    '[RAG_CONTEXT]',
    `Reference: ${reference}`,
    `Translation: ${versionCode}`,
    requiresAttribution ? '' : 'License: Public domain — free to use',
    `Text: "${text}"`,
    '[/RAG_CONTEXT]',
  ].filter(Boolean).join('\n')
}
