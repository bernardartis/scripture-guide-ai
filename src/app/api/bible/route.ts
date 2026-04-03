// app/api/bible/route.ts
// Fetches a specific verse or passage. Used by the chat UI for verse cards.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getVerse } from '@/lib/bible/router'
import type { BibleVersionCode } from '@/types'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const book = searchParams.get('book')
  const chapter = searchParams.get('chapter')
  const verse = searchParams.get('verse')
  const verseEnd = searchParams.get('verseEnd')
  const version = (searchParams.get('version') ?? 'KJV') as BibleVersionCode

  if (!book || !chapter || !verse) {
    return NextResponse.json(
      { error: 'Required params: book, chapter, verse' },
      { status: 400 }
    )
  }

  try {
    const result = await getVerse(
      version,
      book,
      parseInt(chapter),
      parseInt(verse),
      verseEnd ? parseInt(verseEnd) : undefined
    )

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verse not found'
    return NextResponse.json({ error: message }, { status: 404 })
  }
}
