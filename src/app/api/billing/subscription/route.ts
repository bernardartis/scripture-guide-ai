// app/api/billing/subscription/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sub = await db.subscription.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json({
    planTier:          sub?.planTier ?? 'FREE',
    status:            sub?.status ?? 'ACTIVE',
    currentPeriodEnd:  sub?.currentPeriodEnd?.toISOString() ?? null,
    stripeCustomerId:  sub?.stripeCustomerId ?? null,
  })
}
