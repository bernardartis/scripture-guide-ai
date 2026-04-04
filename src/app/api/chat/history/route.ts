// app/api/chat/history/route.ts
// Returns the most recent chat session and its messages for session restoration.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const chatSession = await db.chatSession.findFirst({
    where: {
      userId: session.user.id,
      isArchived: false,
    },
    orderBy: { lastMessageAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 50,
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
          flagged: true,
        },
      },
    },
  })

  if (!chatSession || chatSession.messages.length === 0) {
    return NextResponse.json({ sessionId: null, messages: [] })
  }

  return NextResponse.json({
    sessionId: chatSession.id,
    versionCode: chatSession.versionCode,
    mode: chatSession.mode,
    messages: chatSession.messages,
  })
}
