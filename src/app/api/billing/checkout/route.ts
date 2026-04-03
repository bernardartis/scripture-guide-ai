// app/api/billing/checkout/route.ts
// Creates a Stripe Checkout session for upgrading to Believer or Church plan.
// FTC compliant: price, renewal frequency, and cancel method disclosed
// on the Stripe-hosted checkout page.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured')
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  })
}

const PRICE_IDS: Record<string, string | undefined> = {
  believer_monthly: process.env.STRIPE_PRICE_BELIEVER_MONTHLY,
  believer_annual:  process.env.STRIPE_PRICE_BELIEVER_ANNUAL,
  church_monthly:   process.env.STRIPE_PRICE_CHURCH_MONTHLY,
}

const schema = z.object({
  plan: z.enum(['believer_monthly', 'believer_annual', 'church_monthly']),
})

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const { plan } = parsed.data
  const priceId = PRICE_IDS[plan]
  if (!priceId) {
    return NextResponse.json({ error: 'Price not configured' }, { status: 500 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Reuse existing Stripe customer if available
  const customerParams = user.subscription?.stripeCustomerId
    ? { customer: user.subscription.stripeCustomerId }
    : { customer_email: user.email }

  const checkoutSession = await stripe.checkout.sessions.create({
    ...customerParams,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${appUrl}/billing?cancelled=true`,
    metadata: { userId: session.user.id },
    subscription_data: {
      metadata: { userId: session.user.id },
    },
    // FTC compliance: show clear cancellation info on Stripe checkout
    consent_collection: { terms_of_service: 'required' },
    custom_text: {
      submit: {
        message: 'You can cancel anytime from your account settings. Your subscription renews automatically.',
      },
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
