'use client'

import { useState, useRef, useEffect } from 'react'
import type { BibleVersionCode, ChatMode } from '@/types'

interface VerseOfDay {
  text: string
  reference: string
  versionCode: string
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FREE_VERSIONS: BibleVersionCode[] = ['KJV', 'WEB', 'BSB', 'ASV', 'YLT']

const VERSION_LABELS: Record<BibleVersionCode, string> = {
  KJV:  'KJV — King James Version',
  WEB:  'WEB — World English Bible',
  BSB:  'BSB — Berean Standard Bible',
  ASV:  'ASV — American Standard Version',
  YLT:  'YLT — Young\'s Literal Translation',
  ESV:  'ESV — English Standard Version',
  NASB: 'NASB — New American Standard',
  NLT:  'NLT — New Living Translation',
  CSB:  'CSB — Christian Standard Bible',
}

const QUICK_PROMPTS = [
  'What does the Bible say about anxiety?',
  'Explain grace in simple terms',
  'What is the meaning of John 3:16?',
  'What does Hebrew say about shalom?',
  'How should I handle forgiveness?',
]

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isCrisis?: boolean
}

// ─── DISCLAIMER BANNER ────────────────────────────────────────────────────────

function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800 flex items-start gap-2">
      <span className="mt-0.5 flex-shrink-0 text-amber-500">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </span>
      <span>
        <strong>ScriptureGuide AI</strong> is an AI Bible reference tool — not a licensed pastor, counselor, or therapist.
        For mental health emergencies, call or text <strong>988</strong>.
      </span>
    </div>
  )
}

// ─── VERSE CARD ───────────────────────────────────────────────────────────────

function VerseCard({ reference, text, version }: { reference: string; text: string; version: string }) {
  return (
    <div className="mt-3 bg-white border border-gray-200 border-l-4 border-l-amber-500 rounded-lg p-3">
      <p className="text-xs font-medium text-blue-700 mb-1">{reference}</p>
      <p className="text-sm italic text-gray-800 leading-relaxed">"{text}"</p>
      <p className="text-xs text-gray-400 mt-1.5">— {version}</p>
    </div>
  )
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  // Parse verse cards out of assistant messages
  // Format: [VERSE: Reference | Text | Version]
  const renderContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, i) => (
      <p key={i} className={line === '' ? 'mt-2' : ''}>
        {line
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .split(/(<strong>.*?<\/strong>)/g)
          .map((part, j) =>
            part.startsWith('<strong>') ? (
              <strong key={j}>{part.replace(/<\/?strong>/g, '')}</strong>
            ) : (
              part
            )
          )}
      </p>
    ))
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-gray-100 border border-gray-200 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-gray-800 leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className={`max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed ${
        message.isCrisis
          ? 'bg-red-50 border border-red-200 text-red-900'
          : 'bg-white border border-gray-200 border-l-4 border-l-amber-500 text-gray-800'
      }`}>
        <div className="space-y-1">{renderContent(message.content)}</div>
      </div>
    </div>
  )
}

// ─── MAIN CHAT PAGE ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [version, setVersion] = useState<BibleVersionCode>('KJV')
  const [mode, setMode] = useState<ChatMode>('standard')
  const [votd, setVotd] = useState<VerseOfDay | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Fetch verse of the day
  useEffect(() => {
    fetch('/api/verse-of-the-day')
      .then((r) => r.json())
      .then((d) => d.verse && setVotd(d.verse))
      .catch(() => null)
  }, [])

// Restore most recent chat session on load
  useEffect(() => {
    fetch('/api/chat/history')
      .then((r) => r.json())
      .then((d) => {
        if (d.sessionId && d.messages?.length > 0) {
          setSessionId(d.sessionId)
          setMessages(d.messages.map((m: {
            id: string
            role: string
            content: string
            createdAt: string
          }) => ({
            id: m.id,
            role: m.role.toLowerCase() as 'user' | 'assistant',
            content: m.content,
          })))
        }
      })
      .catch(() => null)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
    }
  }, [input])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          sessionId,
          versionCode: version,
          mode,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Request failed')

      if (data.sessionId && !sessionId) setSessionId(data.sessionId)

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content,
        isCrisis: data.isCrisisResponse,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92650a" strokeWidth="1.5">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm">ScriptureGuide AI</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Bible version selector */}
          <select
            value={version}
            onChange={(e) => setVersion(e.target.value as BibleVersionCode)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {FREE_VERSIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          {/* Mode toggle */}
          <button
            onClick={() => setMode(mode === 'standard' ? 'church' : 'standard')}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              mode === 'church'
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {mode === 'church' ? 'Church mode' : 'Standard'}
          </button>
        </div>
      </header>

      {/* ── DISCLAIMER ─────────────────────────────────────────────────── */}
      <div className="px-4 pt-3">
        <DisclaimerBanner />
      </div>

      {/* ── MESSAGES ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 pb-16 max-w-lg mx-auto w-full">

            {/* Verse of the Day */}
            {votd && (
              <div className="w-full bg-white border border-amber-200 border-l-4 border-l-amber-500 rounded-2xl px-5 py-4 mb-6 text-left">
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">Verse of the day</p>
                <p className="text-sm italic text-gray-800 leading-relaxed mb-2">"{votd.text}"</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">{votd.reference} ({votd.versionCode})</p>
                  <button
                    onClick={() => sendMessage(`Tell me more about ${votd.reference}`)}
                    className="text-xs text-amber-700 hover:underline"
                  >
                    Explore this verse
                  </button>
                </div>
              </div>
            )}

            <h2 className="text-lg font-semibold text-gray-800 mb-1">What's on your heart today?</h2>
            <p className="text-sm text-gray-500 mb-5 max-w-sm">
              Ask a Bible question, explore a passage, or look up what a Greek or Hebrew word really means.
            </p>

            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-800 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 border-l-4 border-l-amber-500 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── INPUT ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 pb-20 md:pb-3">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a Bible question… (Shift+Enter for new line)"
            rows={1}
            className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm placeholder-stone-400 outline-none focus:ring-2 focus:ring-amber-400 transition-all"
            style={{ background: "var(--background)", border: "1px solid var(--border-warm)", color: "var(--ink)", minHeight: '42px', maxHeight: '160px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          ScriptureGuide AI can make mistakes. Always verify with Scripture.{' '}
          <a href="/copyright" className="underline hover:text-gray-600">Bible copyrights</a>
        </p>
      </div>
    </div>
  )
}
