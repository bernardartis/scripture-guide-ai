// Emmaus — Core TypeScript Types

// ─── BIBLE CONTENT ────────────────────────────────────────────────────────────

export type BibleVersionCode = 'KJV' | 'WEB' | 'BSB' | 'ASV' | 'YLT' | 'ESV' | 'NASB' | 'NLT' | 'CSB'

export interface BibleVersion {
  code: BibleVersionCode
  fullName: string
  source: 'aolab' | 'apiBible'
  requiresLicense: boolean
  copyrightNotice: string | null
  copyrightUrl: string | null
  denominationTags: string[]
}

export interface VerseResult {
  text: string
  reference: string           // e.g. "John 3:16" or "Philippians 4:6–7"
  versionCode: BibleVersionCode
  versionName: string
  source: 'aolab' | 'apiBible'
  usedFallback: boolean
  requestedVersion?: BibleVersionCode
  copyrightNotice: string | null
  copyrightUrl: string | null
  inlineCitation: string      // Ready for UI display
  ragContextBlock: string     // Ready for AI prompt injection
}

export interface VerseReference {
  book: string
  chapter: number
  verseStart: number
  verseEnd?: number
  version: BibleVersionCode
}

// ─── AI / CHAT ────────────────────────────────────────────────────────────────

export type ChatMode = 'standard' | 'church' | 'youth' | 'deep_study'

export type ExperienceLevel = 'beginner' | 'growing' | 'intermediate' | 'advanced' | 'scholar'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
  tokensUsed?: number
  flagged?: boolean
}

export interface ChatSession {
  id: string
  userId: string
  versionCode: BibleVersionCode
  mode: ChatMode
  title?: string
  isArchived: boolean
  messageCount: number
  createdAt: Date
  lastMessageAt: Date
  messages?: ChatMessage[]
}

export interface ChatRequest {
  sessionId?: string          // Omit to start a new session
  message: string
  versionCode?: BibleVersionCode
  mode?: ChatMode
}

export interface ChatResponse {
  sessionId: string
  message: ChatMessage
  isCrisisResponse: boolean   // True if crisis handler fired (not AI)
  versesUsed: VerseResult[]
  tokensUsed: number
  latencyMs: number
}

// Crisis detection result
export interface CrisisCheck {
  isCrisis: boolean
  triggeredKeyword?: string
}

// Guardrail result
export interface GuardrailResult {
  blocked: boolean
  reason?: 'prompt_injection' | 'out_of_scope' | 'pii_detected' | 'crisis'
  sanitizedInput?: string
}

// ─── USER & AUTH ──────────────────────────────────────────────────────────────

export type PlanTier = 'free' | 'believer' | 'church'

export interface UserProfile {
  id: string
  userId: string
  denomination?: string
  experienceLevel: ExperienceLevel
  preferredVersionCode: BibleVersionCode
  timezone: string
  churchModeEnabled: boolean
  notificationPrefs: {
    verseOfDay: boolean
    weeklyDigest: boolean
  }
}

export interface UserWithProfile {
  id: string
  email: string
  fullName: string
  role: 'USER' | 'CHURCH_ADMIN' | 'PLATFORM_ADMIN'
  profile?: UserProfile
  subscription?: {
    planTier: PlanTier
    status: string
    currentPeriodEnd?: Date
  }
}

// ─── CONSENT ──────────────────────────────────────────────────────────────────

export type ConsentType = 'religious_data' | 'tos' | 'subscription_billing'

export interface ConsentRecord {
  userId: string
  consentType: ConsentType
  documentVersion: string
  consented: boolean
  ipHash?: string
  timestamp: Date
}

// ─── SUBSCRIPTION ─────────────────────────────────────────────────────────────

export interface PlanFeatures {
  versionsAll: boolean
  versionsFree: BibleVersionCode[]
  greekBasic: boolean
  greekFull: boolean
  churchMode: boolean
  community: boolean
  devotionals: boolean
  familySeats: number
  aiQueriesDaily: number      // -1 = unlimited
  sermonBuilder?: boolean
  adminDashboard?: boolean
}

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  free: {
    versionsAll: false,
    versionsFree: ['KJV', 'WEB', 'BSB'],
    greekBasic: true,
    greekFull: false,
    churchMode: false,
    community: false,
    devotionals: false,
    familySeats: 1,
    aiQueriesDaily: 20,
  },
  believer: {
    versionsAll: true,
    versionsFree: ['KJV', 'WEB', 'BSB', 'ASV', 'YLT', 'ESV', 'NASB', 'NLT', 'CSB'],
    greekBasic: true,
    greekFull: true,
    churchMode: true,
    community: true,
    devotionals: true,
    familySeats: 2,
    aiQueriesDaily: -1,
  },
  church: {
    versionsAll: true,
    versionsFree: ['KJV', 'WEB', 'BSB', 'ASV', 'YLT', 'ESV', 'NASB', 'NLT', 'CSB'],
    greekBasic: true,
    greekFull: true,
    churchMode: true,
    community: true,
    devotionals: true,
    familySeats: 50,
    aiQueriesDaily: -1,
    sermonBuilder: true,
    adminDashboard: true,
  },
}

// ─── API RESPONSES ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string
  code?: string
  statusCode: number
}

export type ApiResponse<T> = { data: T; error: null } | { data: null; error: ApiError }
