// app/api/account/export/route.ts
// GDPR Article 15 / CCPA right to access — returns all user data as JSON.
// Triggered from Settings page. Response is a downloadable file.

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Fetch all data we hold about this user
  const [user, profile, subscription, sessions, bookmarks, consentRecords] =
    await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, fullName: true,
          role: true, createdAt: true, lastLoginAt: true,
        },
      }),
      db.userProfile.findUnique({ where: { userId } }),
      db.subscription.findUnique({
        where: { userId },
        select: {
          planTier: true, status: true,
          currentPeriodStart: true, currentPeriodEnd: true, createdAt: true,
        },
      }),
      db.chatSession.findMany({
        where: { userId },
        include: {
          messages: {
            select: { role: true, content: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit to most recent 100 sessions for export size
      }),
      db.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      db.consentRecord.findMany({
        where: { userId },
        select: {
          consentType: true, documentVersion: true,
          consented: true, timestamp: true, withdrawnAt: true,
        },
        orderBy: { timestamp: 'asc' },
      }),
    ])

  const exportData = {
    exportedAt:      new Date().toISOString(),
    exportVersion:   '1.0',
    dataController:  'ScriptureGuide AI',
    legalBasis:      'GDPR Article 15 / CCPA right to access',

    account: user,
    profile: {
      denomination:         profile?.denomination,
      experienceLevel:      profile?.experienceLevel,
      preferredVersion:     profile?.preferredVersionCode,
      timezone:             profile?.timezone,
      churchModeEnabled:    profile?.churchModeEnabled,
    },
    subscription,
    consentHistory:  consentRecords,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chatSessions:    (sessions as any[]).map((s: any) => ({
      id:           s.id,
      mode:         s.mode,
      versionCode:  s.versionCode,
      createdAt:    s.createdAt,
      messageCount: s.messageCount,
      messages:     s.messages,
    })),
    bookmarks,

    yourRights: {
      rightToErasure:   'Request deletion via Settings → Delete my account',
      rightToCorrection: 'Update profile data via Settings',
      rightToPortability: 'This export satisfies your right to data portability',
      complaints:       'EU users may lodge a complaint with their national supervisory authority',
    },
  }

  const json     = JSON.stringify(exportData, null, 2)
  const filename = `scriptureguide-data-export-${new Date().toISOString().split('T')[0]}.json`

  return new NextResponse(json, {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
