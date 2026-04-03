// lib/auth/index.ts
// NextAuth v5 configuration with Prisma adapter, email/password, and Google OAuth

import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    // Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // Email / password
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await db.user.findUnique({
          where: { email },
          include: { profile: true },
        })

        if (!user || !user.passwordHash) return null
        if (!user.isActive || user.deletedAt) return null

        const passwordValid = await bcrypt.compare(password, user.passwordHash)
        if (!passwordValid) return null

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.sub  = user.id
        // role is added by our credentials provider; cast needed until custom types are declared
        token.role = (user as { id: string; role?: string }).role ?? 'USER'
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },

  events: {
    async createUser({ user }) {
      // Auto-create UserProfile on first sign-up
      if (user.id) {
        await db.userProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            experienceLevel: 'BEGINNER',
            preferredVersionCode: 'KJV',
          },
        })
        // Auto-create free subscription
        await db.subscription.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            planTier: 'FREE',
            status: 'ACTIVE',
          },
        })
      }
    },
  },
})
