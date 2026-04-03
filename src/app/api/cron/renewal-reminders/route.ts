// app/api/cron/renewal-reminders/route.ts
// Sends annual renewal reminder emails 14 days before renewal.
// Required by California Automatic Renewal Law and Minnesota auto-renewal law.
//
// Schedule this endpoint to run daily via Vercel Cron (vercel.json crons config).
// Protected by CRON_SECRET so only Vercel can call it.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendAnnualRenewalReminder } from '@/lib/email'

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron, not the public internet
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + 14) // 14 days from now

  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(23, 59, 59, 999)

  // Find annual subscriptions renewing in exactly 14 days
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upcomingRenewals: any[] = await (db as any).subscription.findMany({
    where: {
      status:            'ACTIVE',
      currentPeriodEnd: { gte: startOfDay, lte: endOfDay },
    },
    include: { user: true },
  })

  let sent = 0
  let failed = 0

  for (const sub of upcomingRenewals) {
    try {
      if (!sub.user?.email) continue

      const renewalDate = new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })

      const amount = sub.planTier === 'CHURCH' ? '$49.00' : '$4.99'

      await sendAnnualRenewalReminder(
        sub.user.email,
        sub.user.fullName,
        renewalDate,
        amount
      )
      sent++
    } catch (err) {
      console.error(`[Cron] Renewal reminder failed for sub ${sub.id}:`, err)
      failed++
    }
  }

  console.log(`[Cron] Renewal reminders: ${sent} sent, ${failed} failed`)
  return NextResponse.json({ sent, failed, checked: upcomingRenewals.length })
}
