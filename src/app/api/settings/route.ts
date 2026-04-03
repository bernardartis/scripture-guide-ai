// app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [profile, consentRecord] = await Promise.all([
    db.userProfile.findUnique({ where: { userId: session.user.id } }),
    db.consentRecord.findFirst({
      where: { userId: session.user.id, consentType: 'religious_data' },
      orderBy: { timestamp: 'desc' },
    }),
  ])

  return NextResponse.json({
    profile,
    religiousDataConsent: consentRecord?.consented ?? false,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { version, level, denomination, churchMode } = await req.json()

  await db.userProfile.update({
    where: { userId: session.user.id },
    data: {
      preferredVersionCode: version,
      experienceLevel:      level?.toUpperCase(),
      denomination:         denomination || null,
      churchModeEnabled:    churchMode ?? false,
    },
  })

  return NextResponse.json({ success: true })
}
