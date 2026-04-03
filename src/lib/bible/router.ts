// lib/bible/router.ts
// Single entry point for all Bible content fetches.
// Routes to AO Lab (free) or API.Bible Pro (licensed) based on version.
// Falls back to KJV silently on any error.

import type { BibleVersionCode, VerseResult } from '@/types'
import { fetchVerseFromAoLab } from './aolab'

// ─── VERSION REGISTRY ─────────────────────────────────────────────────────────

const VERSION_REGISTRY: Record<string, {
  source: 'aolab' | 'apiBible'
  requiresLicense: boolean
  copyrightNotice?: string
  copyrightUrl?: string
}> = {
  // Free / public domain — AO Lab
  KJV:  { source: 'aolab', requiresLicense: false },
  WEB:  { source: 'aolab', requiresLicense: false },
  BSB:  { source: 'aolab', requiresLicense: false },
  ASV:  { source: 'aolab', requiresLicense: false },
  YLT:  { source: 'aolab', requiresLicense: false },

  // Licensed — API.Bible Pro (add when you subscribe)
  ESV:  {
    source: 'apiBible', requiresLicense: true,
    copyrightNotice: 'ESV® Bible © 2001 Crossway. Used by permission.',
    copyrightUrl: 'https://www.crossway.org',
  },
  NASB: {
    source: 'apiBible', requiresLicense: true,
    copyrightNotice: 'NASB® © 1960–2020 The Lockman Foundation. Used by permission.',
    copyrightUrl: 'https://www.lockman.org',
  },
  NLT:  {
    source: 'apiBible', requiresLicense: true,
    copyrightNotice: 'NLT © 1996–2015 Tyndale House Foundation. Used by permission.',
    copyrightUrl: 'https://www.tyndale.com',
  },
  CSB:  {
    source: 'apiBible', requiresLicense: true,
    copyrightNotice: 'CSB® © 2017 Holman Bible Publishers. Used by permission.',
    copyrightUrl: 'https://csbible.com',
  },
}

const FALLBACK_VERSION: BibleVersionCode = 'KJV'
const MAX_DISPLAY_VERSES = 5   // System prompt limit per AI response

// ─── MAIN ROUTER ──────────────────────────────────────────────────────────────

export async function getVerse(
  versionCode: BibleVersionCode,
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number
): Promise<VerseResult> {

  // Enforce display verse limit (legal + DRM)
  const safeVerseEnd = verseEnd
    ? Math.min(verseEnd, verseStart + MAX_DISPLAY_VERSES - 1)
    : undefined

  const versionInfo = VERSION_REGISTRY[versionCode.toUpperCase()]

  if (!versionInfo) {
    console.warn(`[BibleRouter] Unknown version "${versionCode}" — falling back to ${FALLBACK_VERSION}`)
    return getVerse(FALLBACK_VERSION, book, chapter, verseStart, safeVerseEnd)
  }

  try {
    if (versionInfo.source === 'aolab') {
      return await fetchVerseFromAoLab(versionCode, book, chapter, verseStart, safeVerseEnd)
    }

    if (versionInfo.source === 'apiBible') {
      // API.Bible Pro not wired yet — falls through to fallback
      // Uncomment when you subscribe: return await fetchVerseFromApiBible(...)
      console.warn(`[BibleRouter] ${versionCode} requires API.Bible Pro — falling back to ${FALLBACK_VERSION}`)
      const fallback = await fetchVerseFromAoLab(FALLBACK_VERSION, book, chapter, verseStart, safeVerseEnd)
      return {
        ...fallback,
        usedFallback: true,
        requestedVersion: versionCode,
        inlineCitation: `— ${fallback.reference} (${FALLBACK_VERSION}, shown because ${versionCode} requires a paid license)`,
      }
    }

    throw new Error(`Unhandled source: ${versionInfo.source}`)

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[BibleRouter] Fetch error for ${versionCode} ${book} ${chapter}:${verseStart} — ${message}`)

    // Final fallback: KJV from AO Lab
    if (versionCode !== FALLBACK_VERSION) {
      const fallback = await fetchVerseFromAoLab(FALLBACK_VERSION, book, chapter, verseStart, safeVerseEnd)
      return {
        ...fallback,
        usedFallback: true,
        requestedVersion: versionCode,
      }
    }

    throw err
  }
}

// ─── HELPER: VERSIONS AVAILABLE TO A PLAN ────────────────────────────────────

export function getAvailableVersions(planTier: string): BibleVersionCode[] {
  const freeVersions: BibleVersionCode[] = ['KJV', 'WEB', 'BSB', 'ASV', 'YLT']
  const paidVersions: BibleVersionCode[] = ['ESV', 'NASB', 'NLT', 'CSB']

  if (planTier === 'free') return freeVersions
  return [...freeVersions, ...paidVersions]
}

// ─── HELPER: COPYRIGHT PAGE DATA ─────────────────────────────────────────────

export function getCopyrightPageData() {
  const free = Object.entries(VERSION_REGISTRY)
    .filter(([, v]) => !v.requiresLicense)
    .map(([code]) => ({ code, notice: 'Public domain in the United States.' }))

  const licensed = Object.entries(VERSION_REGISTRY)
    .filter(([, v]) => v.requiresLicense)
    .map(([code, v]) => ({
      code,
      notice: v.copyrightNotice!,
      url: v.copyrightUrl!,
    }))

  return { free, licensed }
}
