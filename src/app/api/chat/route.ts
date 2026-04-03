// app/api/chat/route.ts
// The core pipeline: guardrails → Bible fetch → Claude → output validation → response

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getVerse } from '@/lib/bible/router'
import { callClaude } from '@/lib/ai/claude'
import {
  checkForCrisis,
  runInputGuardrails,
  runOutputGuardrails,
  CRISIS_RESPONSE,
  YOUTH_CRISIS_ADDENDUM,
  JAILBREAK_RESPONSE,
} from '@/lib/guardrails'
import type { BibleVersionCode, ChatMode } from '@/types'

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    // ── 1. AUTH CHECK ──────────────────────────────────────────────────────
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    // ── 2. PARSE REQUEST ───────────────────────────────────────────────────
    const body = await req.json()
    const {
      message,
      sessionId,
      versionCode = 'KJV',
      mode = 'standard',
    }: {
      message: string
      sessionId?: string
      versionCode?: BibleVersionCode
      mode?: ChatMode
    } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // ── 3. LOAD USER PROFILE ───────────────────────────────────────────────
    const userProfile = await db.userProfile.findUnique({
      where: { userId },
    })

    const isMinor = false // TODO: derive from DOB stored at signup
    const experienceLevel = (userProfile?.experienceLevel?.toLowerCase() ?? 'beginner') as any
    const denomination = userProfile?.denomination ?? undefined

    // ── 4. CRISIS CHECK — runs BEFORE AI, hardcoded response ───────────────
    const crisisCheck = checkForCrisis(message)
    if (crisisCheck.isCrisis) {
      // Log crisis event for moderation review
      await db.chatMessage.create({
        data: {
          sessionId: await getOrCreateSessionId(userId, versionCode, mode, sessionId),
          role: 'USER',
          content: message,
          flagged: true,
        },
      })

      const crisisText = isMinor
        ? CRISIS_RESPONSE + YOUTH_CRISIS_ADDENDUM
        : CRISIS_RESPONSE

      return NextResponse.json({
        content: crisisText,
        sessionId,
        isCrisisResponse: true,
        tokensUsed: 0,
        latencyMs: Date.now() - startTime,
      })
    }

    // ── 5. INPUT GUARDRAILS ────────────────────────────────────────────────
    const guardrailResult = runInputGuardrails(message)
    if (guardrailResult.blocked) {
      if (guardrailResult.reason === 'prompt_injection') {
        return NextResponse.json({
          content: JAILBREAK_RESPONSE,
          sessionId,
          isCrisisResponse: false,
          tokensUsed: 0,
          latencyMs: Date.now() - startTime,
        })
      }
    }
    const safeMessage = guardrailResult.sanitizedInput ?? message

    // ── 6. GET OR CREATE CHAT SESSION ──────────────────────────────────────
    const activeSessionId = await getOrCreateSessionId(userId, versionCode, mode, sessionId)

    // ── 7. LOAD CONVERSATION HISTORY (last 5 turns) ────────────────────────
    const history = await db.chatMessage.findMany({
      where: { sessionId: activeSessionId },
      orderBy: { createdAt: 'desc' },
      take: 10,  // 5 turns = 10 messages
    })
    const historyOrdered = history.reverse()

    // ── 8. BIBLE RETRIEVAL (RAG) ───────────────────────────────────────────
    // Simple reference detection — replace with semantic search in Phase 2
    const ragBlocks: string[] = []
    const verseRefPattern = /(\d\s)?([A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?/g
    let match
    while ((match = verseRefPattern.exec(safeMessage)) !== null) {
      try {
        const book = (match[1] ? match[1].trim() + ' ' : '') + match[2]
        const chapter = parseInt(match[3])
        const verseStart = parseInt(match[4])
        const verseEnd = match[5] ? parseInt(match[5]) : undefined
        const verse = await getVerse(versionCode, book, chapter, verseStart, verseEnd)
        ragBlocks.push(verse.ragContextBlock)
      } catch {
        // Reference not parseable — skip silently
      }
    }

    // ── 9. CALL CLAUDE ─────────────────────────────────────────────────────
    const isFirstMessage = historyOrdered.length === 0
    const claudeResult = await callClaude({
      userMessage: safeMessage,
      ragContextBlocks: ragBlocks,
      conversationHistory: historyOrdered.map((m: {
        id: string
        role: string
        content: string
        createdAt: Date
      }) => ({
        id: m.id,
        role: m.role.toLowerCase() as 'user' | 'assistant',
        content: m.content,
        createdAt: m.createdAt,
      })),
      mode,
      experienceLevel,
      preferredVersion: versionCode,
      denomination,
      isFirstMessage,
    })

    // ── 10. OUTPUT GUARDRAILS ──────────────────────────────────────────────
    const outputCheck = runOutputGuardrails(claudeResult.content)
    const finalContent = outputCheck.sanitizedResponse

    // ── 11. PERSIST MESSAGES ───────────────────────────────────────────────
    await db.$transaction([
      // Save user message
      db.chatMessage.create({
        data: {
          sessionId: activeSessionId,
          role: 'USER',
          content: message, // Store original, not sanitized
          tokensUsed: 0,
        },
      }),
      // Save assistant message
      db.chatMessage.create({
        data: {
          sessionId: activeSessionId,
          role: 'ASSISTANT',
          content: finalContent,
          tokensUsed: claudeResult.tokensUsed,
          latencyMs: claudeResult.latencyMs,
          modelVersion: claudeResult.modelVersion,
          flagged: outputCheck.flagged,
        },
      }),
      // Update session stats
      db.chatSession.update({
        where: { id: activeSessionId },
        data: {
          messageCount: { increment: 2 },
          totalTokensUsed: { increment: claudeResult.tokensUsed },
          lastMessageAt: new Date(),
        },
      }),
    ])

    return NextResponse.json({
      content: finalContent,
      sessionId: activeSessionId,
      isCrisisResponse: false,
      tokensUsed: claudeResult.tokensUsed,
      latencyMs: Date.now() - startTime,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Chat API Error]', message)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function getOrCreateSessionId(
  userId: string,
  versionCode: BibleVersionCode,
  mode: ChatMode,
  existingSessionId?: string
): Promise<string> {
  if (existingSessionId) {
    const existing = await db.chatSession.findFirst({
      where: { id: existingSessionId, userId },
    })
    if (existing) return existing.id
  }

  const newSession = await db.chatSession.create({
    data: {
      userId,
      versionCode,
      mode: mode.toUpperCase() as any,
    },
  })
  return newSession.id
}
