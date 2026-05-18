// app/api/chat/route.ts
// Streaming chat pipeline: guardrails → Bible fetch → Claude stream → SSE → persist

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getVerse } from '@/lib/bible/router'
import { streamClaude } from '@/lib/ai/claude'
import {
  checkForCrisis,
  runInputGuardrails,
  runOutputGuardrails,
  CRISIS_RESPONSE,
  YOUTH_CRISIS_ADDENDUM,
  JAILBREAK_RESPONSE,
} from '@/lib/guardrails'
import type { BibleVersionCode, ChatMode } from '@/types'

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
}

function encodeEvent(encoder: TextEncoder, payload: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
}

export async function POST(req: NextRequest) {
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
    const userProfile = await db.userProfile.findUnique({ where: { userId } })

    const isMinor = false // TODO: derive from DOB stored at signup
    const experienceLevel = (userProfile?.experienceLevel?.toLowerCase() ?? 'beginner') as any
    const denomination = userProfile?.denomination ?? undefined

    // ── 4. GET OR CREATE CHAT SESSION (needed for every streamed path) ─────
    const activeSessionId = await getOrCreateSessionId(userId, versionCode, mode, sessionId)

    const encoder = new TextEncoder()

    // ── 5. CRISIS CHECK — streamed canned response ─────────────────────────
    const crisisCheck = checkForCrisis(message)
    if (crisisCheck.isCrisis) {
      const crisisText = isMinor ? CRISIS_RESPONSE + YOUTH_CRISIS_ADDENDUM : CRISIS_RESPONSE
      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(encodeEvent(encoder, { type: 'session', sessionId: activeSessionId }))

            await db.chatMessage.create({
              data: {
                sessionId: activeSessionId,
                role: 'USER',
                content: message,
                flagged: true,
              },
            })

            controller.enqueue(encodeEvent(encoder, { type: 'delta', text: crisisText }))

            await db.chatMessage.create({
              data: {
                sessionId: activeSessionId,
                role: 'ASSISTANT',
                content: crisisText,
                tokensUsed: 0,
                flagged: true,
              },
            })
            await db.chatSession.update({
              where: { id: activeSessionId },
              data: {
                lastMessageAt: new Date(),
                messageCount: { increment: 2 },
              },
            })

            controller.enqueue(encodeEvent(encoder, { type: 'done' }))
          } catch (err) {
            console.error('[Crisis stream error]', err)
          } finally {
            controller.close()
          }
        },
      })
      return new Response(readable, { headers: SSE_HEADERS })
    }

    // ── 6. INPUT GUARDRAILS ────────────────────────────────────────────────
    const guardrailResult = runInputGuardrails(message)
    if (guardrailResult.blocked && guardrailResult.reason === 'prompt_injection') {
      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(encodeEvent(encoder, { type: 'session', sessionId: activeSessionId }))
            controller.enqueue(encodeEvent(encoder, { type: 'delta', text: JAILBREAK_RESPONSE }))
            controller.enqueue(encodeEvent(encoder, { type: 'done' }))
          } finally {
            controller.close()
          }
        },
      })
      return new Response(readable, { headers: SSE_HEADERS })
    }
    const safeMessage = guardrailResult.sanitizedInput ?? message

    // ── 7. LOAD CONVERSATION HISTORY (last 5 turns) ────────────────────────
    const history = await db.chatMessage.findMany({
      where: { sessionId: activeSessionId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    const historyOrdered = history.reverse()

    // ── 8. BIBLE RETRIEVAL (RAG) ───────────────────────────────────────────
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

    // ── 9. STREAM FROM CLAUDE ──────────────────────────────────────────────
    const isFirstMessage = historyOrdered.length === 0
    const claudeStream = streamClaude({
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

    const readable = new ReadableStream({
      async start(controller) {
        const startTime = Date.now()
        try {
          controller.enqueue(encodeEvent(encoder, { type: 'session', sessionId: activeSessionId }))

          // Persist the user message before streaming so history stays consistent.
          await db.chatMessage.create({
            data: {
              sessionId: activeSessionId,
              role: 'USER',
              content: message,
              tokensUsed: 0,
            },
          })

          let assembled = ''
          for await (const event of claudeStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const text = event.delta.text
              assembled += text
              controller.enqueue(encodeEvent(encoder, { type: 'delta', text }))
            }
          }

          const finalMessage = await claudeStream.finalMessage()
          const tokensUsed = finalMessage.usage.input_tokens + finalMessage.usage.output_tokens
          const outputCheck = runOutputGuardrails(assembled)

          await db.chatMessage.create({
            data: {
              sessionId: activeSessionId,
              role: 'ASSISTANT',
              content: outputCheck.sanitizedResponse,
              tokensUsed,
              latencyMs: Date.now() - startTime,
              modelVersion: finalMessage.model,
              flagged: outputCheck.flagged,
            },
          })
          await db.chatSession.update({
            where: { id: activeSessionId },
            data: {
              lastMessageAt: new Date(),
              messageCount: { increment: 2 },
              totalTokensUsed: { increment: tokensUsed },
            },
          })

          controller.enqueue(encodeEvent(encoder, { type: 'done' }))
        } catch (err) {
          console.error('[Chat stream error]', err)
          try {
            controller.enqueue(
              encodeEvent(encoder, {
                type: 'delta',
                text: "\n\nI'm having trouble finishing that response. Please try again.",
              })
            )
            controller.enqueue(encodeEvent(encoder, { type: 'done' }))
          } catch {}
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, { headers: SSE_HEADERS })
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Chat API Error]', errMessage)
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
