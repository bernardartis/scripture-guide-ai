'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTheme } from '@/lib/theme'
import type { BibleVersionCode, ChatMode } from '@/types'

// ─── TYPES ────────────────────────────────────────────────────────────────────

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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FREE_VERSIONS: BibleVersionCode[] = ['KJV', 'WEB', 'BSB', 'ASV', 'YLT']

const MODES: { value: ChatMode; label: string; desc: string }[] = [
  { value: 'standard',   label: 'Standard',   desc: 'Scripture guidance for every season of life' },
  { value: 'church',     label: 'Pastor',      desc: 'Sermon prep and pastoral guidance' },
  { value: 'youth',      label: 'Youth',       desc: 'No judgment. Real answers for real life.' },
  { value: 'deep_study', label: 'Deep Study',  desc: 'Original languages, context, and cross-canonical analysis' },
]

const QUICK_PROMPTS: Record<string, string[]> = {
  standard: [
    "I'm struggling with anxiety and fear",
    "I don't know if I believe anymore",
    "My marriage is falling apart",
    "I feel like God has abandoned me",
    "What does the Bible say about grief?",
    "I've been sober 6 months and I'm scared",
  ],
  church: [
    "Help me prepare a sermon on forgiveness",
    "My congregation is walking through collective grief",
    "Give me cross-references for Romans 8:28",
    "What are denominational views on this passage?",
    "Help me explain the Trinity to a new believer",
    "What does this passage mean in its original context?",
  ],
  youth: [
    "Why does God feel so far away sometimes?",
    "Does God care about what I'm going through at school?",
    "What does the Bible say about being anxious?",
    "Is it okay to have doubts about my faith?",
    "How do I know if God is real?",
    "What does the Bible say about friendship and loyalty?",
  ],
  deep_study: [
    "Analyze the chiastic structure of Philippians 2:6-11",
    "Compare the Synoptic accounts of the Last Supper",
    "What is the significance of the aorist tense in John 3:16?",
    "Trace the theology of shalom from Torah to the Prophets",
    "What did Second Temple Judaism teach about resurrection?",
    "Examine Paul's use of pistis Christou in Galatians",
  ],
}

const SUGGESTED_FOLLOWUPS: Record<string, string[]> = {
  standard: [
    'Are there other passages that speak to this struggle?',
    'How do I pray through what you just shared?',
    'What does the original word mean here?',
  ],
  church: [
    'What illustrations from Scripture support this point?',
    'How would I explain this to someone with no church background?',
    'What do the original Greek or Hebrew words reveal here?',
  ],
  youth: [
    'Can you say that in simpler terms?',
    "What's a story from the Bible about this?",
    'How would this apply to my everyday life?',
  ],
  deep_study: [
    'What do the major commentaries say about this?',
    'How does this connect to Second Temple Jewish thought?',
    'Walk me through the original language word by word?',
  ],
}

const MODE_COPY: Record<string, { heading: string; subtext: string; placeholder: string }> = {
  standard: {
    heading: "What's on your heart today?",
    subtext: "Bring your questions, your struggles, your doubts. Walk with the Word — wherever you are on the road.",
    placeholder: "What's on your heart today… (Shift+Enter for new line)",
  },
  church: {
    heading: "What are you preparing today?",
    subtext: "Sermon research, pastoral care, and theological depth — built for those who shepherd others.",
    placeholder: "What are you preparing or studying today… (Shift+Enter for new line)",
  },
  youth: {
    heading: "What's going on in your life?",
    subtext: "No judgment. No complicated language. Just real answers from Scripture for real life.",
    placeholder: "Ask anything — no question is too small or too big… (Shift+Enter for new line)",
  },
  deep_study: {
    heading: "What are you studying today?",
    subtext: "Original languages, historical context, and cross-canonical analysis — seminary depth without the tuition.",
    placeholder: "Enter a passage, doctrine, or theological question… (Shift+Enter for new line)",
  },
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseVerseCards(content: string): { text: string; hasVerse: boolean; reference?: string; verseText?: string } {
  const versePattern = /["\u201c\u201d]([^"\u201c\u201d]{20,300})["\u201c\u201d][—\-\u2013]\s*([1-3]?\s?[A-Za-z]+\s+\d+:\d+(?:[\u2013-]\d+)?)\s*\(([A-Z]+)\)/
  const match = content.match(versePattern)
  if (match) {
    return { text: content, hasVerse: true, verseText: match[1], reference: `${match[2]} (${match[3]})` }
  }
  return { text: content, hasVerse: false }
}

function parseGreekHebrew(content: string): GreekHebrewChip[] {
  const chips: GreekHebrewChip[] = []
  const pattern = /Strong['\u2019s]*\s+([GH]\d+)|\(([GH]\d+)\)/gi
  let m: RegExpExecArray | null
  while ((m = pattern.exec(content)) !== null) {
    const code = m[1] || m[2]
    if (code && !chips.find(c => c.strongs === code)) {
      chips.push({ original: '', transliteration: '', strongs: code, definition: '', language: code.startsWith('G') ? 'Greek' : 'Hebrew' })
    }
  }
  return chips.slice(0, 3)
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function DisclaimerBanner() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 text-xs rounded-lg mx-4 mt-3 flex-shrink-0"
         style={{ background: 'rgba(106,122,56,0.08)', border: '1px solid rgba(106,122,56,0.2)', color: 'var(--accent-deep)' }}>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      <span>
        <strong>Emmaus</strong> is an AI Scripture companion — not a licensed pastor, counselor, or therapist.
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
          style={{ background: copied ? 'rgba(106,122,56,0.15)' : 'var(--bg-surface)', color: copied ? 'var(--accent-deep)' : 'var(--ink-muted)', border: '1px solid var(--border)' }}>
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
          style={{ background: bookmarked ? 'rgba(106,122,56,0.15)' : 'var(--bg-surface)', color: bookmarked ? 'var(--accent-deep)' : 'var(--ink-muted)', border: '1px solid var(--border)' }}>
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

function SuggestedFollowUps({ onSelect, mode }: { onSelect: (q: string) => void; mode: string }) {
  const questions = SUGGESTED_FOLLOWUPS[mode] ?? SUGGESTED_FOLLOWUPS.standard
  return (
    <div className="mt-3 space-y-1.5">
      {questions.map((q) => (
        <button key={q} onClick={() => onSelect(q)}
          className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors"
          style={{ background: 'var(--suggest-bg)', border: '1px solid var(--border)', color: 'var(--suggest-text)' }}>
          {q} →
        </button>
      ))}
    </div>
  )
}

function MessageBubble({ message, isLast, onFollowUp, mode }: {
  message: Message; isLast: boolean; onFollowUp: (q: string) => void; mode: string
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

  const renderContent = (text: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0" style={{ color: 'var(--ink)', lineHeight: '1.7' }}>{children}</p>
        ),
        strong: ({ children }) => (
          <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{children}</strong>
        ),
        em: ({ children }) => (
          <em style={{ color: 'var(--ink)', fontStyle: 'italic' }}>{children}</em>
        ),
        h1: ({ children }) => (
          <h1 className="text-base font-semibold mt-3 mb-1" style={{ color: 'var(--ink)', fontFamily: 'Lora, serif' }}>{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-semibold mt-3 mb-1" style={{ color: 'var(--ink)', fontFamily: 'Lora, serif' }}>{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mt-2 mb-1" style={{ color: 'var(--ink)' }}>{children}</h3>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-4 space-y-1 my-2" style={{ color: 'var(--ink)' }}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 space-y-1 my-2" style={{ color: 'var(--ink)' }}>{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm" style={{ color: 'var(--ink)' }}>{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 pl-3 my-2 italic"
            style={{ borderColor: 'var(--accent)', color: 'var(--ink-muted)' }}>
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-3" style={{ borderColor: 'var(--border)' }} />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse" style={{ color: 'var(--ink)' }}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead style={{ background: 'var(--bg-surface)' }}>{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr style={{ borderBottom: '1px solid var(--border)' }}>{children}</tr>,
        th: ({ children }) => (
          <th className="text-left px-3 py-2 font-semibold text-xs"
            style={{ color: 'var(--ink)', borderBottom: '2px solid var(--border)' }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-xs" style={{ color: 'var(--ink)' }}>{children}</td>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  )

  return (
    <div className={`flex justify-start ${animClass}`}>
      <div className="max-w-[88%] space-y-1">
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed"
             style={message.isCrisis
               ? { background: '#fef2f2', border: '1px solid #fecaca', color: '#7f1d1d' }
               : { background: 'var(--msg-ai-bg)', border: '1px solid var(--border)', borderLeft: '3px solid var(--msg-ai-border)' }}>
          <div>{renderContent(message.content)}</div>
        </div>

        {parsed?.hasVerse && parsed.verseText && parsed.reference && (
          <VerseCard reference={parsed.reference} text={parsed.verseText} />
        )}

        {chips.length > 0 && <GreekHebrewChips chips={chips} />}

        {isLast && !message.isCrisis && (
          <SuggestedFollowUps onSelect={onFollowUp} mode={mode} />
        )}
      </div>
    </div>
  )
}

// ─── MAIN CHAT PAGE ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const { theme, toggle } = useTheme()
  const [messages, setMessages]       = useState<Message[]>([])
  const [input, setInput]             = useState('')
  const [isLoading, setIsLoading]     = useState(false)
  const [sessionId, setSessionId]     = useState<string | undefined>()
  const [version, setVersion]         = useState<BibleVersionCode>('KJV')
  const [mode, setMode]               = useState<ChatMode>('standard')
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

  const deleteSession = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this conversation? It cannot be undone.')) return
    await fetch('/api/chat/sessions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid }),
    })
    setHistory(prev => prev.filter(s => s.id !== sid))
    if (sid === sessionId) {
      setSessionId(undefined)
      setMessages([])
    }
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
              <div key={s.id}
                className="flex items-start group border-l-2 transition-colors"
                style={{
                  borderLeftColor: s.id === sessionId ? 'var(--accent)' : 'transparent',
                  background: s.id === sessionId ? 'rgba(106,122,56,0.08)' : 'transparent',
                }}>
                <button onClick={() => loadSession(s.id)}
                  className="flex-1 text-left px-4 py-3 min-w-0">
                  <p className="text-xs font-medium mb-0.5 leading-snug truncate" style={{ color: 'var(--ink)' }}>
                    {s.title}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                    {s.date} · {s.messageCount} messages
                  </p>
                </button>
                <button onClick={(e) => deleteSession(s.id, e)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 mt-2 mr-2 rounded-lg transition-all"
                  style={{ color: 'var(--ink-faint)' }}
                  title="Delete conversation">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8L13 4"/>
                  </svg>
                </button>
              </div>
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
                background: showHistory ? 'rgba(106,122,56,0.15)' : 'var(--bg-surface)',
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
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3" fill="white" stroke="none"/>
              </svg>
            </div>
            <span className="text-sm font-medium hidden sm:block" style={{ fontFamily: 'Lora, serif', color: 'var(--ink)' }}>
              Emmaus
            </span>
          </div>

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
                {MODE_COPY[mode]?.heading ?? "What's on your heart today?"}
              </h2>
              <p className="text-sm mb-5" style={{ color: 'var(--ink-muted)' }}>
                {MODE_COPY[mode]?.subtext ?? "Bring your questions, your struggles, your doubts."}
              </p>

              <div className="flex flex-wrap gap-2 justify-center">
                {(QUICK_PROMPTS[mode] ?? QUICK_PROMPTS.standard).map((prompt) => (
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
              mode={mode}
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
              placeholder={MODE_COPY[mode]?.placeholder ?? "What's on your heart today… (Shift+Enter for new line)"}
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
            Emmaus can make mistakes. Always verify with Scripture.{' '}
            <a href="/copyright" className="underline" style={{ color: 'var(--ink-faint)' }}>Bible copyrights</a>
          </p>
        </div>

      </div>
    </div>
  )
}
