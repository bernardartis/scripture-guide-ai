// lib/bible/aolab.ts
// AO Lab Free Use Bible API — no key, no rate limits, MIT licensed
// Covers KJV, WEB, BSB, ASV, YLT, and 1,000+ others
// Docs: https://bible.helloao.org/docs/

import type { BibleVersionCode, VerseResult } from '@/types'

const BASE_URL = 'https://bible.helloao.org/api'

// AO Lab translation IDs differ from the short codes used in the app
const TRANSLATION_IDS: Record<string, string> = {
  KJV: 'eng_kjv',
  WEB: 'ENGWEBP',
  BSB: 'BSB',
  ASV: 'eng_asv',
  YLT: 'eng_ylt',
}

export function getAoLabTranslationId(versionCode: BibleVersionCode): string {
  return TRANSLATION_IDS[versionCode] ?? versionCode
}

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

// Shape of the ".simple.json" chapter endpoint: each content item is a
// heading, subtitle, line break, or verse with flattened text.
interface AoLabSimpleContentItem {
  type: 'verse' | 'heading' | 'hebrew_subtitle' | 'line_break' | string
  number?: number
  text?: string
}

interface AoLabSimpleChapterResponse {
  chapter: {
    number: number
    content: AoLabSimpleContentItem[]
  }
  numberOfVerses?: number
}

export interface ChapterVerse {
  number: number
  text: string
}

function cleanVerseText(raw: string): string {
  return raw
    .replace(/\u00b6/g, '')   // KJV pilcrow paragraph markers
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Fetch a whole chapter as an ordered list of { number, text } verses.
 * bookId is the AO Lab book ID (GEN, PSA, MAT, ...). Safe to call from the
 * browser: the API sends Access-Control-Allow-Origin: *.
 */
export async function fetchChapterFromAoLab(
  versionCode: BibleVersionCode,
  bookId: string,
  chapter: number
): Promise<ChapterVerse[]> {
  const translationId = getAoLabTranslationId(versionCode)
  const url = `${BASE_URL}/${translationId}/${bookId}/${chapter}.simple.json`

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 86400 }, // Cache for 24h — Bible text doesn't change
  })

  if (!response.ok) {
    throw new Error(`AO Lab API error ${response.status} for ${versionCode} ${bookId} ${chapter}`)
  }

  const data: AoLabSimpleChapterResponse = await response.json()
  const verses: ChapterVerse[] = []

  for (const item of data.chapter?.content ?? []) {
    if (item.type !== 'verse' || typeof item.number !== 'number') continue
    const text = cleanVerseText(item.text ?? '')
    if (!text) continue
    verses.push({ number: item.number, text })
  }

  return verses
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

  const verses = await fetchChapterFromAoLab(versionCode, bookId, chapter)

  const selected = verses.filter((v) =>
    verseEnd ? v.number >= verseStart && v.number <= verseEnd : v.number === verseStart
  )

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
