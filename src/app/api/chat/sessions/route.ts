// app/api/chat/sessions/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessions = await db.chatSession.findMany({
    where: {
      userId: session.user.id,
      isArchived: false,
      messageCount: { gt: 0 },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 30,
    select: {
      id: true,
      createdAt: true,
      lastMessageAt: true,
      messageCount: true,
      mode: true,
      messages: {
        take: 1,
        orderBy: { createdAt: 'asc' },
        where: { role: 'USER' },
        select: { content: true },
      },
    },
  })

  const formatted = sessions.map((s: {
    id: string
    createdAt: Date
    lastMessageAt: Date
    messageCount: number
    mode: string
    messages: { content: string }[]
  }) => {
    const firstMsg = s.messages[0]?.content ?? 'Bible study session'
    const title = firstMsg.length > 45 ? firstMsg.slice(0, 45) + '…' : firstMsg

    const now = new Date()
    const msgDate = new Date(s.lastMessageAt)
    const diffDays = Math.floor((now.getTime() - msgDate.getTime()) / 86400000)
    let dateLabel: string
    if (diffDays === 0) dateLabel = 'Today'
    else if (diffDays === 1) dateLabel = 'Yesterday'
    else if (diffDays < 7) dateLabel = `${diffDays} days ago`
    else dateLabel = msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    return { id: s.id, title, date: dateLabel, messageCount: s.messageCount, mode: s.mode }
  })

  return NextResponse.json({ sessions: formatted })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const chatSession = await db.chatSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 50,
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  })

  if (!chatSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json({
    sessionId: chatSession.id,
    messages: chatSession.messages,
    versionCode: chatSession.versionCode,
    mode: chatSession.mode,
  })
}

// DELETE — archive a session (soft delete)
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const chatSession = await db.chatSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
  })

  if (!chatSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  await db.chatSession.update({
    where: { id: sessionId },
    data: { isArchived: true },
  })

  return NextResponse.json({ success: true })
}
