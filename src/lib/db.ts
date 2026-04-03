// lib/db.ts — Prisma client singleton
// Prevents creating multiple connections in development hot-reload
//
// NOTE: Run `npx prisma generate` after connecting your Supabase DATABASE_URL
// to generate the fully-typed PrismaClient. Until then the type is `any`.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')

type PrismaClientType = InstanceType<typeof PrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined
}

export const db: PrismaClientType =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
