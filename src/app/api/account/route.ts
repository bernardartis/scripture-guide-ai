// app/api/account/route.ts
// Account deletion — GDPR Article 17 right to erasure.
// Soft-deletes the user and schedules data purge within 30 days (45 for CA).

import { NextResponse } from 'next/server'
import { auth, signOut } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  await db.$transaction(async (tx: any) => {
    // Soft-delete the user (sets deletedAt — a background job does the hard delete)
    await tx.user.update({
      where: { id: userId },
      data:  { deletedAt: new Date(), isActive: false },
    })

    // Immediately anonymize chat messages
    const sessions = await tx.chatSession.findMany({ where: { userId } })
    for (const s of sessions) {
      await tx.chatMessage.updateMany({
        where: { sessionId: s.id },
        data:  { content: '[deleted]' },
      })
    }

    // Cancel Stripe subscription if active
    const sub = await tx.subscription.findUnique({ where: { userId } })
    if (sub?.stripeSubId) {
      // Stripe cancellation handled by webhook after stripe.subscriptions.cancel()
      // For now just mark cancelled in DB
      await tx.subscription.update({
        where: { userId },
        data:  { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: 'user_deleted_account' },
      })
    }
  })

  await signOut()
  return NextResponse.json({ success: true })
}
