'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTheme } from '@/lib/theme'
import type { BibleVersionCode, ChatMode } from '@/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isCrisis?: boolean
  isNew?: boolean
}

interface SessionSummary {
  id: string
  title: string
  date: string
  messageCount: number
  mode: string
}

interface VerseOfDay {
  text: string
  reference: string
  versionCode: string
}

interface GreekHebrewChip {
  original: string
  transliteration: string
  strongs: string
  definition: string
  language: 'Greek' | 'Hebrew'
}

const FREE_VERSIONS: BibleVersionCode[] = ['KJV', 'WEB', 'BSB', 'ASV', 'YLT']

const MODES: { value: ChatMode; label: string; desc: string }[] = [
  { value: 'standard',   label: 'Standard',  desc: 'General Bible study for all levels' },
  { value: 'church',     label: 'Church',     desc: 'Quick references for sermon use' },
  { value: 'youth',      label: 'Youth',      desc: 'Plain language for younger readers' },
  { value: 'deep_study', label: 'Deep Study', desc: 'Seminary-level Greek & Hebrew analysis' },
]

const QUICK_PROMPTS = [
  'What does the Bible say about anxiety?',
  'Explain grace in simple terms',
  'What is the meaning of John 3:16?',
  'What does the Hebrew word shalom mean?',
  'How should I handle forgiveness?',
]

const SUGGESTED_FOLLOWUPS = [
  'What is the original Greek or Hebrew word here?',
  'What cross-references relate to this passage?',
  'How do different denominations interpret this?',
]

function parseVerseCards(content: string): { hasVerse: boolean; reference?: string; verseText?: string } {
  const versePattern = /[\u201c\u201d""]([^\u201c\u201d""]{20,300})[\u201c\u201d""][—\-\u2013]\s*([1-3]?\s?[A-Za-z]+\s+\d+:\d+(?:[\u2013-]\d+)?)\s*\(([A-Z]+)\)/
  const match = content.match(versePattern)
  if (match) {
    return { hasVerse: true, verseText: match[1], reference: `${match[2]} (${match[3]})` }
  }
  return { hasVerse: false }
}

function parseGreekHebrew(content: string): GreekHebrewChip[] {
  const chips: GreekHebrewChip[] = []
  const pattern = /Strong[''s]*\s+([GH]\d+)|\(([GH]\d+)\)/gi
  let m: RegExpExecArray | null
  while ((m = pattern.exec(content)) !== null) {
    const code = m[1] || m[2]
    if (code && !chips.find(c => c.strongs === code)) {
      chips.push({ original: '', transliteration: '', strongs: code, definition: '', language: code.startsWith('G') ? 'Greek' : 'Hebrew' })
    }
  }
  return chips.slice(0, 3)
}

function DisclaimerBanner() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 text-xs rounded-lg mx-4 mt-3 flex-shrink-0"
         style={{ background: 'rgba(234,131,58,0.08)', border: '1px solid rgba(234,131,58,0.2)', color: 'var(--accent-deep)' }}>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      <span>
        <strong>ScriptureGuide AI</strong> is an AI Bible reference tool — not a licensed pastor, counselor, or therapist.
        Mental health emergencies: call or text <strong>988</strong>.
      </span>
    </div>
  )
}

function VerseCard({ reference, text }: { reference: string; text: string }) {
  const [copied, setCopied] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${text}" — ${reference}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-3 rounded-xl p-3.5"
         style={{ background: 'var(--verse-bg)', border: '1px solid var(--border)', borderLeft: '3px solid var(--verse-border)' }}>
      <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
        {reference}
      </p>
      <p className="text-sm leading-relaxed mb-3 verse-text" style={{ color: 'var(--ink)' }}>
        &ldquo;{text}&rdquo;
      </p>
      <div className="flex gap-2 flex-wrap">
        <button onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
          style={{ background: copied ? 'rgba(234,131,58,0.15)' : 'var(--bg-surface)', color: copied ? 'var(--accent-deep)' : 'var(--ink-muted)', border: '1px solid var(--border)' }}>
          {copied ? '✓ Copied' : (
            <>
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="4" width="9" height="10" rx="1.5"/>
                <path d="M3 12H2.5A1.5 1.5 0 011 10.5v-8A1.5 1.5 0 012.5 1h7A1.5 1.5 0 0111 2.5V3"/>
              </svg>
              Copy verse
            </>
          )}
        </button>
        <button onClick={() => setBookmarked(true)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
          style={{ background: bookmarked ? 'rgba(234,131,58,0.15)' : 'var(--bg-surface)', color: bookmarked ? 'var(--accent-deep)' : 'var(--ink-muted)', border: '1px solid var(--border)' }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 2h10v13l-5-3-5 3V2z"/>
          </svg>
          {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </button>
      </div>
    </div>
  )
}

function GreekHebrewChips({ chips }: { chips: GreekHebrewChip[] }) {
  if (chips.length === 0) return null
  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      {chips.map((chip) => (
        <div key={chip.strongs}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: 'var(--chip-bg)', border: '1px solid var(--chip-border)', color: 'var(--chip-text)' }}>
          <span className="font-semibold">{chip.strongs}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>{chip.language}</span>
        </div>
      ))}
    </div>
  )
}

function SuggestedFollowUps({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="mt-3 space-y-1.5">
      {SUGGESTED_FOLLOWUPS.map((q) => (
        <button key={q} onClick={() => onSelect(q)}
          className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors"
          style={{ background: 'var(--suggest-bg)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>
          {q} →
        </button>
      ))}
    </div>
  )
}

function MessageBubble({ message, isLast, onFollowUp }: {
  message: Message; isLast: boolean; onFollowUp: (q: string) => void
}) {
   const isUser = message.role === 'user'
  const parsed = !isUser ? parseVerseCards(message.content) : null
  const chips  = !isUser ? parseGreekHebrew(message.content) : []
  const animClass = message.isNew ? 'message-enter' : ''

  if (isUser) {
    return (
      <div className={`flex justify-end ${animClass}`}>
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed"
             style={{ background: 'var(--accent-grad)', color: 'white' }}>
          {message.content}
        </div>
      </div>
    )
  }

  const renderContent = (text: string) =>
    text.split('\n').map((line, i) => (
      <p key={i} className={line === '' ? 'mt-2' : ''} style={{ color: 'var(--ink)' }}>
        {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
          part.startsWith('**')
            ? <strong key={j} style={{ color: 'var(--ink)' }}>{part.replace(/\*\*/g, '')}</strong>
            : part
        )}
      </p>
    ))

  return (
      <div className={`flex justify-start ${animClass}`}>
      <div className="max-w-[88%] space-y-1">
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed"
             style={message.isCrisis
               ? { background: '#fef2f2', border: '1px solid #fecaca', color: '#7f1d1d' }
               : { background: 'var(--msg-ai-bg)', border: '1px solid var(--border)', borderLeft: '3px solid var(--msg-ai-border)' }}>
          <div className="space-y-1">{renderContent(message.content)}</div>
        </div>

        {parsed?.hasVerse && parsed.verseText && parsed.reference && (
          <VerseCard reference={parsed.reference} text={parsed.verseText} />
        )}

        {chips.length > 0 && <GreekHebrewChips chips={chips} />}

        {isLast && !message.isCrisis && (
          <SuggestedFollowUps onSelect={onFollowUp} />
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { theme, toggle } = useTheme()
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [version, setVersion]     = useState<BibleVersionCode>('KJV')
  const [mode, setMode]           = useState<ChatMode>('standard')
  const [votd, setVotd]               = useState<VerseOfDay | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory]         = useState<SessionSummary[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    const el = inputRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px' }
  }, [input])

  useEffect(() => {
    fetch('/api/verse-of-the-day')
      .then(r => r.json())
      .then(d => d.verse && setVotd(d.verse))
      .catch(() => null)
  }, [])

useEffect(() => {
    fetch('/api/chat/history')
      .then(r => r.json())
      .then(d => {
        if (d.sessionId && d.messages?.length > 0) {
          setSessionId(d.sessionId)
          setMessages(d.messages.map((m: { id: string; role: string; content: string }) => ({
            id: m.id,
            role: m.role.toLowerCase() as 'user' | 'assistant',
            content: m.content,
            isNew: false,
          })))
        }
      })
      .catch(() => null)
  }, [])

  useEffect(() => {
    fetch('/api/chat/sessions')
      .then(r => r.json())
      .then(d => d.sessions && setHistory(d.sessions))
      .catch(() => null)
  }, [messages.length])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: text.trim(), isNew: true }])
    setInput('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), sessionId, versionCode: version, mode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      if (data.sessionId && !sessionId) setSessionId(data.sessionId)
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: data.content, isCrisis: data.isCrisisResponse, isNew: true,
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.", isNew: true,
      }])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }, [isLoading, sessionId, version, mode])

  const loadSession = useCallback(async (sid: string) => {
    const res = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid }),
    })
    const data = await res.json()
    if (data.sessionId) {
      setSessionId(data.sessionId)
      setMessages(data.messages.map((m: { id: string; role: string; content: string }) => ({
        id: m.id,
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
        isNew: false,
      })))
      setShowHistory(false)
    }
  }, [])

  const startNewSession = () => {
    setSessionId(undefined)
    setMessages([])
    setShowHistory(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const currentMode = MODES.find(m => m.value === mode)!

  return (
    <div className="flex h-full min-h-0" style={{ background: 'var(--bg-primary)' }}>

      {/* HISTORY SIDEBAR */}
      {showHistory && (
        <div className="w-64 flex-shrink-0 flex flex-col"
             style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3"
               style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-faint)' }}>
              Recent sessions
            </span>
            <button onClick={() => setShowHistory(false)}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ color: 'var(--ink-faint)', background: 'var(--bg-surface)' }}>
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            <button onClick={startNewSession}
              className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2"
              style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border-light)' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 1v14M1 8h14"/>
              </svg>
              New conversation
            </button>

            {history.length === 0 && (
              <p className="text-xs px-4 py-6 text-center" style={{ color: 'var(--ink-faint)' }}>
                No past sessions yet
              </p>
            )}

            {history.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className="w-full text-left px-4 py-3 transition-colors border-l-2"
                style={{
                  borderLeftColor: s.id === sessionId ? 'var(--accent)' : 'transparent',
                  background: s.id === sessionId ? 'rgba(234,131,58,0.08)' : 'transparent',
                }}>
                <p className="text-xs font-medium mb-0.5 leading-snug" style={{ color: 'var(--ink)' }}>
                  {s.title}
                </p>
                <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                  {s.date} · {s.messageCount} messages
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MAIN CHAT AREA */}
      <div className="flex flex-col flex-1 min-w-0 h-full min-h-0">

      {/* HEADER */}
      <header className="flex-shrink-0 px-4 py-2.5 flex items-center justify-between gap-3"
              style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHistory(h => !h)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: showHistory ? 'rgba(234,131,58,0.15)' : 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: showHistory ? 'var(--accent)' : 'var(--ink-faint)'
            }}
            title="Session history">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 8v4l3 3M3.05 11a9 9 0 1 0 .5-3M3 4v4h4"/>
            </svg>
          </button>
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
               style={{ background: 'var(--accent-grad)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <span className="text-sm font-medium hidden sm:block" style={{ fontFamily: 'Lora, serif', color: 'var(--ink)' }}>
            ScriptureGuide AI
          </span>
        </div>

        {/* Mode pills */}
        <div className="flex gap-1 overflow-x-auto flex-1 mx-2" style={{ scrollbarWidth: 'none' }}>
          {MODES.map((m) => (
            <button key={m.value} onClick={() => setMode(m.value)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-all"
              style={mode === m.value
                ? { background: 'var(--accent-grad)', color: 'white', fontWeight: 500 }
                : { background: 'var(--bg-surface)', color: 'var(--ink-muted)', border: '1px solid var(--border)' }}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <select value={version} onChange={(e) => setVersion(e.target.value as BibleVersionCode)}
            className="text-xs px-2 py-1.5 rounded-lg outline-none"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}>
            {FREE_VERSIONS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <button onClick={toggle}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>
            {theme === 'dark' ? '☀' : '☽'}
          </button>
        </div>
      </header>

      {/* Mode description bar */}
      <div className="flex-shrink-0 px-4 py-1.5 text-xs text-center"
           style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)', color: 'var(--ink-faint)' }}>
        {currentMode.desc}
      </div>

      <DisclaimerBanner />

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 pb-16 max-w-lg mx-auto w-full">
            {votd && (
              <div className="w-full rounded-2xl px-5 py-4 mb-6 text-left"
                   style={{ background: 'var(--verse-bg)', border: '1px solid var(--border)', borderLeft: '3px solid var(--verse-border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--accent)' }}>
                  Verse of the day
                </p>
                <p className="text-sm leading-relaxed mb-2 verse-text" style={{ color: 'var(--ink)' }}>
                  &ldquo;{votd.text}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>{votd.reference} ({votd.versionCode})</p>
                  <button onClick={() => sendMessage(`Tell me more about ${votd.reference}`)}
                    className="text-xs" style={{ color: 'var(--accent)' }}>
                    Explore →
                  </button>
                </div>
              </div>
            )}
            <h2 className="text-lg font-semibold mb-1 font-serif" style={{ color: 'var(--ink)' }}>
              What&apos;s on your heart today?
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--ink-muted)' }}>
              Ask a Bible question, explore a passage, or look up what a Greek or Hebrew word really means.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_PROMPTS.map((prompt) => (
                <button key={prompt} onClick={() => sendMessage(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isLast={i === messages.length - 1 && msg.role === 'assistant'}
            onFollowUp={sendMessage}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm px-4 py-3"
                 style={{ background: 'var(--msg-ai-bg)', border: '1px solid var(--border)', borderLeft: '3px solid var(--msg-ai-border)' }}>
              <div className="flex gap-1.5 items-center h-4">
                {[0, 150, 300].map(delay => (
                  <div key={delay} className="w-1.5 h-1.5 rounded-full animate-bounce"
                       style={{ background: 'var(--accent)', animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="flex-shrink-0 px-4 py-3 pb-20 md:pb-3"
           style={{ background: 'var(--header-bg)', borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a Bible question… (Shift+Enter for new line)"
            rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 transition-all"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
              minHeight: '42px',
              maxHeight: '160px',
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'var(--accent-grad)' }}
            aria-label="Send message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: 'var(--ink-faint)' }}>
          ScriptureGuide AI can make mistakes. Always verify with Scripture.{' '}
          <a href="/copyright" className="underline" style={{ color: 'var(--ink-faint)' }}>Bible copyrights</a>
        </p>
      </div>

      </div>
    </div>
  )
}
