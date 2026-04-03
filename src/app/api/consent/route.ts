// app/api/consent/route.ts
// Handles consent updates (GDPR Art. 7 — right to withdraw).
// Every change is logged immutably — do not delete consent records.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, consented } = await req.json()

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const ipHash = Buffer.from(ip).toString('base64').slice(0, 64)

  // If withdrawing religious data consent, schedule data purge
  if (type === 'religious_data' && consented === false) {
    await db.userProfile.update({
      where: { userId: session.user.id },
      data:  { denomination: null },
    })
    // Chat history is purged by a background job that checks withdrawn consent
    // For now, mark the session to skip history persistence
  }

  // Always log the consent change — immutable audit trail
  await db.consentRecord.create({
    data: {
      userId:          session.user.id,
      consentType:     type,
      documentVersion: 'v1.0',
      consented,
      ipHash,
      withdrawnAt:     consented ? null : new Date(),
    },
  })

  return NextResponse.json({ success: true })
}
