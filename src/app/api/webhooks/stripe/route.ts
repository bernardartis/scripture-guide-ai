// app/api/webhooks/stripe/route.ts
// Stripe webhook handler — subscription lifecycle management.
// Updated for Stripe SDK v17 (API version 2026-03-25.dahlia).
// In v17: invoice.subscription moved to invoice.parent.subscription_details
// and Subscription no longer has current_period_start/end at top level.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'
import { sendSubscriptionConfirmation } from '@/lib/email'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured')
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  })
}

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_BELIEVER_MONTHLY ?? '']: 'BELIEVER',
  [process.env.STRIPE_PRICE_BELIEVER_ANNUAL  ?? '']: 'BELIEVER',
  [process.env.STRIPE_PRICE_CHURCH_MONTHLY   ?? '']: 'CHURCH',
}

// Helper — extract subscription ID from an Invoice in SDK v17
function getSubIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent as Stripe.Invoice.Parent | null
  if (!parent) return null
  // v17: subscription lives under parent.subscription_details.subscription
  const details = (parent as any).subscription_details
  if (details?.subscription) {
    return typeof details.subscription === 'string'
      ? details.subscription
      : details.subscription?.id ?? null
  }
  return null
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed'
    console.error('[Stripe Webhook] Verification failed:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  console.log(`[Stripe Webhook] ${event.type}`)

  try {
    switch (event.type) {

      // ── Checkout completed (new subscriber) ───────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.userId
        if (!userId) {
          console.error('[Stripe Webhook] Missing userId in metadata')
          break
        }

        const stripeSubId = typeof session.subscription === 'string'
          ? session.subscription
          : (session.subscription as any)?.id
        const stripeCustomerId = typeof session.customer === 'string'
          ? session.customer
          : (session.customer as any)?.id

        if (!stripeSubId || !stripeCustomerId) break

        // Retrieve the subscription for price details
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId)
        const priceId   = stripeSub.items.data[0]?.price.id ?? ''
        const planTier  = PRICE_TO_PLAN[priceId] ?? 'BELIEVER'

        // In v17, period dates are on billing_cycle_anchor and start_date
        // Use start_date as period start; calculate period end from interval
        const startDate = new Date((stripeSub as any).start_date * 1000)
        const endDate   = getPeriodEnd(stripeSub)

        await db.subscription.upsert({
          where:  { userId },
          update: {
            planTier:           planTier as any,
            status:             'ACTIVE',
            stripeSubId,
            stripeCustomerId,
            currentPeriodStart: startDate,
            currentPeriodEnd:   endDate,
          },
          create: {
            userId,
            planTier:           planTier as any,
            status:             'ACTIVE',
            stripeSubId,
            stripeCustomerId,
            currentPeriodStart: startDate,
            currentPeriodEnd:   endDate,
          },
        })

        // Send subscription confirmation email — non-blocking
        try {
          const confirmedUser = await db.user.findUnique({ where: { id: userId } })
          if (confirmedUser) {
            const renewalStr = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            const priceStr   = planTier === 'CHURCH' ? '$49.00' : '$4.99'
            sendSubscriptionConfirmation(
              confirmedUser.email,
              confirmedUser.fullName,
              planTier === 'CHURCH' ? 'Church' : 'Believer',
              renewalStr,
              priceStr
            ).catch((e: Error) => console.error('[Webhook] Subscription email failed:', e.message))
          }
        } catch { /* non-critical */ }

        break
      }

      // ── Subscription updated ──────────────────────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string'
          ? sub.customer : (sub.customer as any)?.id

        const existing = await db.subscription.findFirst({
          where: { stripeCustomerId: customerId },
        })
        if (!existing) break

        const priceId  = sub.items.data[0]?.price.id ?? ''
        const planTier = PRICE_TO_PLAN[priceId] ?? existing.planTier

        await db.subscription.update({
          where: { id: existing.id },
          data: {
            planTier:           planTier as any,
            status:             mapStatus(sub.status),
            stripeSubId:        sub.id,
            currentPeriodStart: new Date(((sub as any).start_date ?? (sub as any).billing_cycle_anchor ?? Math.floor(Date.now()/1000)) * 1000),
            currentPeriodEnd:   getPeriodEnd(sub),
            cancelledAt:        (sub as any).canceled_at
              ? new Date((sub as any).canceled_at * 1000)
              : null,
          },
        })

        await logSubEvent(existing.id, event.type, event.id, sub)
        break
      }

      // ── Subscription cancelled ────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await db.subscription.updateMany({
          where: { stripeSubId: sub.id },
          data:  { status: 'CANCELLED', planTier: 'FREE', cancelledAt: new Date() },
        })
        const existing = await db.subscription.findFirst({ where: { stripeSubId: sub.id } })
        if (existing) await logSubEvent(existing.id, event.type, event.id, sub)
        break
      }

      // ── Payment succeeded ─────────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = getSubIdFromInvoice(invoice)
        if (subId) {
          await db.subscription.updateMany({
            where: { stripeSubId: subId },
            data:  { status: 'ACTIVE' },
          })
        }
        break
      }

      // ── Payment failed ────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = getSubIdFromInvoice(invoice)
        if (subId) {
          await db.subscription.updateMany({
            where: { stripeSubId: subId },
            data:  { status: 'PAST_DUE' },
          })
        }
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Handler error'
    console.error(`[Stripe Webhook] Error for ${event.type}:`, message)
    return NextResponse.json({ received: true, error: message })
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function mapStatus(status: Stripe.Subscription.Status): string {
  const map: Record<Stripe.Subscription.Status, string> = {
    active:             'ACTIVE',
    canceled:           'CANCELLED',
    incomplete:         'PAST_DUE',
    incomplete_expired: 'CANCELLED',
    past_due:           'PAST_DUE',
    trialing:           'TRIALING',
    unpaid:             'UNPAID',
    paused:             'PAST_DUE',
  }
  return map[status] ?? 'ACTIVE'
}

// In Stripe v17 current_period_start/end are no longer top-level.
// Best approximation: use billing_cycle_anchor + the price's interval.
function getPeriodEnd(sub: Stripe.Subscription): Date {
  // Attempt to read from items if available in extended response
  const raw = sub as any
  if (raw.current_period_end) return new Date(raw.current_period_end * 1000)
  // Fallback: billing_cycle_anchor + 30 days (monthly default)
  const anchor = raw.billing_cycle_anchor ?? Math.floor(Date.now() / 1000)
  return new Date((anchor + 30 * 24 * 60 * 60) * 1000)
}

async function logSubEvent(
  subscriptionId: string,
  eventType: string,
  stripeEventId: string,
  payload: object
) {
  await db.subscriptionEvent.create({
    data: { subscriptionId, eventType, stripeEventId, payload: payload as any },
  }).catch((e: Error) => console.error('[Stripe Webhook] Failed to log event:', e.message))
}
