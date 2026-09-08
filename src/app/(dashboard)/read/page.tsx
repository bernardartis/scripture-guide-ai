'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BIBLE_BOOKS, getBook, getChapterArray } from '@/lib/bible/books'
import { fetchChapterFromAoLab, type ChapterVerse } from '@/lib/bible/aolab'
import { applyFocusReadingToVerses } from '@/lib/bible/focusReading'
import type { BibleVersionCode } from '@/types'

const FREE_VERSIONS: BibleVersionCode[] = ['KJV', 'WEB', 'BSB', 'ASV', 'YLT']
const FOCUS_STORAGE_KEY = 'emmaus-focus-reading'

const OT_BOOKS = BIBLE_BOOKS.filter((b) => b.testament === 'OT')
const NT_BOOKS = BIBLE_BOOKS.filter((b) => b.testament === 'NT')

const selectStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  color: 'var(--ink)',
} as const

function chapterHeading(bookId: string, bookName: string, chapter: number): string {
  if (bookId === 'PSA') return `Psalm ${chapter}`
  return `${bookName} ${chapter}`
}

export default function ReadPage() {
  const router = useRouter()
  const [selectedBook, setSelectedBook]       = useState<string>('GEN')
  const [selectedChapter, setSelectedChapter] = useState<number>(1)
  const [selectedVersion, setSelectedVersion] = useState<BibleVersionCode>('KJV')
  const [verses, setVerses]                   = useState<ChapterVerse[]>([])
  const [isLoading, setIsLoading]             = useState<boolean>(true)
  const [error, setError]                     = useState<string | null>(null)
  const [focusReading, setFocusReading]       = useState<boolean>(false)
  const [retryCount, setRetryCount]           = useState<number>(0)
  const versesRef = useRef<HTMLDivElement>(null)

  const book = getBook(selectedBook) ?? BIBLE_BOOKS[0]
  const bookIndex = BIBLE_BOOKS.findIndex((b) => b.id === book.id)
  const isFirstChapter = bookIndex === 0 && selectedChapter === 1
  const isLastChapter = bookIndex === BIBLE_BOOKS.length - 1 && selectedChapter === book.chapters

  // Focus Reading preference: read once on mount, persist on toggle
  useEffect(() => {
    try {
      setFocusReading(localStorage.getItem(FOCUS_STORAGE_KEY) === 'true')
    } catch {
      // storage unavailable: keep default
    }
  }, [])

  const toggleFocusReading = () => {
    setFocusReading((prev) => {
      const next = !prev
      try { localStorage.setItem(FOCUS_STORAGE_KEY, String(next)) } catch { /* ignore */ }
      return next
    })
  }

  // Load the chapter whenever the selection changes
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchChapterFromAoLab(selectedVersion, selectedBook, selectedChapter)
      .then((result) => {
        if (cancelled) return
        setVerses(result)
        setIsLoading(false)
        versesRef.current?.scrollTo({ top: 0 })
      })
      .catch(() => {
        if (cancelled) return
        setVerses([])
        setError('Unable to load this chapter. Please try again.')
        setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [selectedBook, selectedChapter, selectedVersion, retryCount])

  const handleBookChange = (bookId: string) => {
    setSelectedBook(bookId)
    setSelectedChapter(1)
  }

  const goPrevious = useCallback(() => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1)
      return
    }
    if (bookIndex > 0) {
      const prevBook = BIBLE_BOOKS[bookIndex - 1]
      setSelectedBook(prevBook.id)
      setSelectedChapter(prevBook.chapters)
    }
  }, [selectedChapter, bookIndex])

  const goNext = useCallback(() => {
    if (selectedChapter < book.chapters) {
      setSelectedChapter(selectedChapter + 1)
      return
    }
    if (bookIndex < BIBLE_BOOKS.length - 1) {
      setSelectedBook(BIBLE_BOOKS[bookIndex + 1].id)
      setSelectedChapter(1)
    }
  }, [selectedChapter, book.chapters, bookIndex])

  const askEmmaus = () => {
    const params = new URLSearchParams({
      book: book.name,
      chapter: String(selectedChapter),
      version: selectedVersion,
    })
    router.push(`/chat?${params.toString()}`)
  }

  const renderedVerses = focusReading
    ? applyFocusReadingToVerses(verses)
    : verses.map((v) => ({ ...v, html: '' }))

  const testamentLabel = book.testament === 'OT' ? 'Old Testament' : 'New Testament'

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 h-full" style={{ background: 'var(--bg-primary)' }}>

      {/* HEADER */}
      <header className="flex-shrink-0 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap"
              style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={selectedBook}
            onChange={(e) => handleBookChange(e.target.value)}
            aria-label="Book"
            className="text-xs px-2 py-1.5 rounded-lg outline-none max-w-[11rem]"
            style={selectStyle}>
            <optgroup label="Old Testament">
              {OT_BOOKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </optgroup>
            <optgroup label="New Testament">
              {NT_BOOKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </optgroup>
          </select>

          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(parseInt(e.target.value, 10))}
            aria-label="Chapter"
            className="text-xs px-2 py-1.5 rounded-lg outline-none"
            style={selectStyle}>
            {getChapterArray(book.id).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>

          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value as BibleVersionCode)}
            aria-label="Translation"
            className="text-xs px-2 py-1.5 rounded-lg outline-none"
            style={selectStyle}>
            {FREE_VERSIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs cursor-pointer select-none flex-shrink-0"
               style={{ color: 'var(--ink-muted)' }}>
          <span>Focus Reading</span>
          <button
            type="button"
            role="switch"
            aria-checked={focusReading}
            onClick={toggleFocusReading}
            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
            style={{
              background: focusReading ? 'var(--accent)' : 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}>
            <span
              className="inline-block h-3.5 w-3.5 rounded-full transition-transform"
              style={{
                background: focusReading ? 'white' : 'var(--ink-faint)',
                transform: focusReading ? 'translateX(18px)' : 'translateX(3px)',
              }} />
          </button>
        </label>
      </header>

      {/* CHAPTER HEADING */}
      <div className="flex-shrink-0 px-4 md:px-6 pt-4 pb-2">
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--ink-faint)' }}>
          {testamentLabel} · {book.name}
        </p>
        <h1 className="text-2xl font-medium" style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--ink)' }}>
          {chapterHeading(book.id, book.name, selectedChapter)}
        </h1>
      </div>

      {/* VERSES */}
      <div ref={versesRef} className="messages-scroll px-4 py-4 md:px-6">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex gap-1.5 items-center h-4">
              {[0, 150, 300].map((delay) => (
                <div key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce"
                     style={{ background: 'var(--accent)', animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>{error}</p>
            <button
              onClick={() => setRetryCount((n) => n + 1)}
              className="text-xs px-4 py-2 rounded-full transition-colors"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <div className="max-w-2xl mx-auto">
            {renderedVerses.map((v) => (
              <p key={v.number}
                 style={{ fontFamily: 'Lora, Georgia, serif', fontSize: '16px', lineHeight: 1.9, color: 'var(--ink)' }}
                 className="mb-2">
                <sup className="mr-1 text-xs font-semibold select-none" style={{ color: 'var(--accent)' }}>
                  {v.number}
                </sup>
                {focusReading
                  ? <span dangerouslySetInnerHTML={{ __html: v.html }} />
                  : <span>{v.text}</span>}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM BAR */}
      <div className="flex-shrink-0 px-3 py-3 md:px-4 flex items-center justify-between gap-2"
           style={{
             background: 'var(--header-bg)',
             borderTop: '1px solid var(--border)',
             paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
           }}>
        <button
          onClick={goPrevious}
          disabled={isFirstChapter}
          aria-label="Previous chapter"
          className="flex-shrink-0 h-10 px-3 rounded-xl text-sm flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </button>

        <button
          onClick={askEmmaus}
          className="flex-1 max-w-xs h-10 px-4 rounded-xl text-sm text-white truncate transition-all active:scale-95"
          style={{ background: 'var(--accent-grad)' }}>
          Ask Emmaus about this chapter →
        </button>

        <button
          onClick={goNext}
          disabled={isLastChapter}
          aria-label="Next chapter"
          className="flex-shrink-0 h-10 px-3 rounded-xl text-sm flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>
          <span className="hidden sm:inline">Next</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
