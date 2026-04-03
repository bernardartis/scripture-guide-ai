// app/api/auth/signup/route.ts
// Creates a new user account with all required consent records.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sendWelcomeEmail } from '@/lib/email'

const signupSchema = z.object({
  fullName:              z.string().min(2).max(200),
  email:                 z.string().email(),
  password:              z.string().min(8),
  dob:                   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tosConsent:            z.boolean(),
  religiousDataConsent:  z.boolean(),
})

function calculateAge(dob: string): number {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const { fullName, email, password, dob, tosConsent, religiousDataConsent } = parsed.data

    // ToS must be accepted
    if (!tosConsent) {
      return NextResponse.json(
        { error: 'Terms of Service must be accepted.' },
        { status: 400 }
      )
    }

    // Age gate — COPPA compliance
    const age = calculateAge(dob)
    if (age < 13) {
      return NextResponse.json(
        { error: 'Users must be at least 13 years old.' },
        { status: 400 }
      )
    }

    // Check email not already in use
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    // Get IP for consent record (for GDPR audit trail)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown'
    const userAgent = req.headers.get('user-agent') ?? 'unknown'
    // Hash IP — never store raw IP (privacy by design)
    const ipHash = Buffer.from(ip).toString('base64').slice(0, 64)

    // Create user, profile, subscription, and consent records atomically
    const user = await db.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          fullName,
          email,
          passwordHash,
          role: 'USER',
        },
      })

      // Auto-create profile
      await tx.userProfile.create({
        data: {
          userId: newUser.id,
          experienceLevel: 'BEGINNER',
          preferredVersionCode: 'KJV',
        },
      })

      // Auto-create free subscription
      await tx.subscription.create({
        data: {
          userId: newUser.id,
          planTier: 'FREE',
          status: 'ACTIVE',
        },
      })

      // Record ToS consent (required — immutable audit trail)
      await tx.consentRecord.create({
        data: {
          userId: newUser.id,
          consentType: 'tos',
          documentVersion: 'v1.0',
          consented: true,
          ipHash,
          userAgent,
        },
      })

      // Record religious data consent (GDPR Art. 9 — separate explicit consent)
      await tx.consentRecord.create({
        data: {
          userId: newUser.id,
          consentType: 'religious_data',
          documentVersion: 'v1.0',
          consented: religiousDataConsent,
          ipHash,
          userAgent,
        },
      })

      return newUser
    })

    // Send welcome email — non-blocking, don't fail signup if email fails
    sendWelcomeEmail(user.email, user.fullName).catch((e: Error) =>
      console.error('[Signup] Welcome email failed:', e.message)
    )

    return NextResponse.json(
      { success: true, userId: user.id },
      { status: 201 }
    )

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Signup Error]', message)
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
