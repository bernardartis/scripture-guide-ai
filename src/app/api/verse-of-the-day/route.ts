// app/api/verse-of-the-day/route.ts
// Returns a daily rotating verse from a curated list.
// Uses AO Lab Free Use API — KJV, no license required.
// The verse index rotates based on the day of the year.

import { NextResponse } from 'next/server'
import { fetchVerseFromAoLab } from '@/lib/bible/aolab'

// 52 curated verses — one per week of the year, cycling
const VERSE_ROTATION: Array<{ book: string; chapter: number; verse: number; verseEnd?: number }> = [
  { book: 'John',          chapter: 3,  verse: 16 },
  { book: 'Philippians',   chapter: 4,  verse: 6,  verseEnd: 7 },
  { book: 'Jeremiah',      chapter: 29, verse: 11 },
  { book: 'Romans',        chapter: 8,  verse: 28 },
  { book: 'Psalms',        chapter: 23, verse: 1 },
  { book: 'Proverbs',      chapter: 3,  verse: 5,  verseEnd: 6 },
  { book: 'Isaiah',        chapter: 40, verse: 31 },
  { book: 'Matthew',       chapter: 11, verse: 28, verseEnd: 29 },
  { book: 'Romans',        chapter: 12, verse: 2 },
  { book: 'Ephesians',     chapter: 2,  verse: 8,  verseEnd: 9 },
  { book: 'Psalms',        chapter: 46, verse: 10 },
  { book: 'John',          chapter: 14, verse: 6 },
  { book: '1 Peter',       chapter: 5,  verse: 7 },
  { book: 'Galatians',     chapter: 5,  verse: 22, verseEnd: 23 },
  { book: 'Joshua',        chapter: 1,  verse: 9 },
  { book: 'Romans',        chapter: 5,  verse: 8 },
  { book: 'Psalms',        chapter: 119, verse: 105 },
  { book: 'Hebrews',       chapter: 11, verse: 1 },
  { book: 'John',          chapter: 16, verse: 33 },
  { book: 'Matthew',       chapter: 6,  verse: 33 },
  { book: '2 Timothy',     chapter: 3,  verse: 16, verseEnd: 17 },
  { book: 'Psalms',        chapter: 37, verse: 4 },
  { book: 'Isaiah',        chapter: 41, verse: 10 },
  { book: 'Ephesians',     chapter: 6,  verse: 10, verseEnd: 11 },
  { book: 'Romans',        chapter: 15, verse: 13 },
  { book: 'James',         chapter: 1,  verse: 2,  verseEnd: 3 },
  { book: 'Colossians',    chapter: 3,  verse: 23 },
  { book: 'Psalms',        chapter: 91, verse: 1,  verseEnd: 2 },
  { book: 'John',          chapter: 10, verse: 10 },
  { book: '2 Corinthians', chapter: 5,  verse: 17 },
  { book: 'Proverbs',      chapter: 22, verse: 6 },
  { book: 'Matthew',       chapter: 5,  verse: 16 },
  { book: 'Romans',        chapter: 8,  verse: 38, verseEnd: 39 },
  { book: 'John',          chapter: 15, verse: 5 },
  { book: 'Psalms',        chapter: 139, verse: 14 },
  { book: '1 Corinthians', chapter: 13, verse: 4,  verseEnd: 7 },
  { book: 'Micah',         chapter: 6,  verse: 8 },
  { book: 'Hebrews',       chapter: 4,  verse: 16 },
  { book: 'Psalms',        chapter: 1,  verse: 1,  verseEnd: 2 },
  { book: '1 John',        chapter: 4,  verse: 18 },
  { book: 'Galatians',     chapter: 2,  verse: 20 },
  { book: 'Matthew',       chapter: 22, verse: 37, verseEnd: 39 },
  { book: 'Isaiah',        chapter: 26, verse: 3 },
  { book: 'Psalms',        chapter: 34, verse: 8 },
  { book: 'Romans',        chapter: 1,  verse: 16 },
  { book: 'Ephesians',     chapter: 3,  verse: 20, verseEnd: 21 },
  { book: 'John',          chapter: 8,  verse: 36 },
  { book: '2 Timothy',     chapter: 1,  verse: 7 },
  { book: 'Psalms',        chapter: 27, verse: 1 },
  { book: 'Matthew',       chapter: 28, verse: 19, verseEnd: 20 },
  { book: 'Romans',        chapter: 8,  verse: 1 },
  { book: 'Revelation',    chapter: 21, verse: 4 },
]

export async function GET() {
  // Rotate daily — same verse for everyone on the same day
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  const index = dayOfYear % VERSE_ROTATION.length
  const ref   = VERSE_ROTATION[index]

  try {
    const verse = await fetchVerseFromAoLab(
      'KJV',
      ref.book,
      ref.chapter,
      ref.verse,
      ref.verseEnd
    )

    return NextResponse.json(
      { verse, dayIndex: index },
      {
        headers: {
          // Cache for 1 hour on CDN — verse changes daily, not more often
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (err) {
    // Fallback to a hardcoded verse if AO Lab is unavailable
    return NextResponse.json({
      verse: {
        text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
        reference: 'John 3:16',
        versionCode: 'KJV',
        versionName: 'King James Version',
        inlineCitation: '— John 3:16 (KJV)',
        copyrightNotice: null,
      },
      dayIndex: index,
    })
  }
}
