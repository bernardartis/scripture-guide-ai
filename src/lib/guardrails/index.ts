// lib/guardrails/index.ts
// Pre- and post-processing safety layer for all AI interactions.
// Crisis detection runs BEFORE the AI model — hardcoded response, no AI involvement.

import type { CrisisCheck, GuardrailResult } from '@/types'

// ─── CRISIS DETECTION ─────────────────────────────────────────────────────────
// Legal requirement: IL WOPR Act, NY AI Act, NV AB 406, UT HB 452
// Must fire before the AI model processes the message.

const CRISIS_KEYWORDS = [
  // Suicidal ideation
  'want to die', 'wanting to die', 'end my life', 'ending my life',
  'kill myself', 'killing myself', 'take my own life', 'not want to be here',
  "don't want to be here", 'no reason to live', 'better off dead',
  'thinking about suicide', 'suicidal', 'commit suicide',
  // Self-harm
  'hurt myself', 'hurting myself', 'harm myself', 'cut myself', 'cutting myself',
  'self-harm', 'self harm', 'overdose', 'overdosing',
  // Abuse / danger
  'someone is hurting me', 'being hurt', 'not safe at home', 'being abused',
  'someone is abusing me', 'in danger',
  // Youth-specific (enhanced for 13-17 users)
  'nobody cares about me', "no one cares about me", "i'm a burden", 'i am a burden',
  'wish i was dead', 'wish i wasn\'t here', 'wish i was never born',
]

export function checkForCrisis(message: string): CrisisCheck {
  const lower = message.toLowerCase()
  const triggered = CRISIS_KEYWORDS.find((kw) => lower.includes(kw))
  return {
    isCrisis: !!triggered,
    triggeredKeyword: triggered,
  }
}

export const CRISIS_RESPONSE = `I hear that you're going through something incredibly difficult right now. Please reach out for immediate support:

**988 Suicide & Crisis Lifeline** — Call or text **988** (US, available 24/7)
**Crisis Text Line** — Text **HOME** to **741741**
**Emergency Services** — Call **911** if you are in immediate danger
**International resources** — https://www.iasp.info/resources/Crisis_Centres/

You matter, and trained people are ready to help you right now. Please reach out to them.`

export const YOUTH_CRISIS_ADDENDUM = `

If you're at school, you can also talk to a school counselor.
**Childhelp National Child Abuse Hotline** — **1-800-422-4453** (if you're being hurt at home)`

// ─── INPUT GUARDRAILS ─────────────────────────────────────────────────────────

const PROMPT_INJECTION_PATTERNS = [
  /ignore (all |previous |your )?(previous |prior )?(instructions?|rules?|guidelines?|constraints?)/i,
  /you are now/i,
  /pretend (you (have|are)|to be)/i,
  /forget (everything|all|your|the) (you (know|were|are)|instructions?|rules?)/i,
  /your (real|true|actual) (self|purpose|goal|instructions?) (is|are)/i,
  /developer mode/i,
  /jailbreak/i,
  /do anything now/i,
  /dan mode/i,
  /act as (if you (have|are|were)|an? )/i,
  /reveal (your|the) (system |hidden )?prompt/i,
  /show me your (instructions?|prompt|system message)/i,
  /anthropic (said|says|told|tells|wants|allows)/i,
]

const OUT_OF_SCOPE_PATTERNS = [
  { pattern: /\b(vote|elect|democrat|republican|trump|biden|political party|congress|senate)\b/i, reason: 'political' as const },
  { pattern: /\b(diagnos|prescri|medication dosage|medical advice|treat my|cure my)\b/i, reason: 'medical' as const },
  { pattern: /\b(legal advice|sue|lawsuit|attorney|my case|file a claim)\b/i, reason: 'legal' as const },
  { pattern: /\b(invest(ment)?|stock(s)?|crypto|buy shares|financial advice)\b/i, reason: 'financial' as const },
]

// PII patterns to redact before sending to AI
const PII_PATTERNS = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN REDACTED]' },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD REDACTED]' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL REDACTED]' },
  { pattern: /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/g, replacement: '[PHONE REDACTED]' },
]

export function runInputGuardrails(message: string): GuardrailResult {
  // 1. Prompt injection check
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      return { blocked: true, reason: 'prompt_injection' }
    }
  }

  // 2. Out-of-scope check
  for (const { pattern } of OUT_OF_SCOPE_PATTERNS) {
    if (pattern.test(message)) {
      // Don't block — the AI will handle the deflection gracefully
      // Just flag it so we can log
      break
    }
  }

  // 3. PII redaction (sanitize before sending to AI)
  let sanitizedInput = message
  for (const { pattern, replacement } of PII_PATTERNS) {
    sanitizedInput = sanitizedInput.replace(pattern, replacement)
  }

  return {
    blocked: false,
    sanitizedInput,
  }
}

// ─── OUTPUT GUARDRAILS ────────────────────────────────────────────────────────

const PROHIBITED_OUTPUT_PATTERNS = [
  // AI claiming to be a professional
  /i am (a |your )?(licensed |certified |ordained )?(pastor|minister|priest|counselor|therapist|psychologist|psychiatrist|doctor|physician)/i,
  /as your (pastor|counselor|therapist|spiritual director|minister)/i,
  // Downplaying crisis
  /you (don't|do not) need (to call|professional)/i,
  /instead of (calling|contacting) (a professional|988|crisis)/i,
]

export function runOutputGuardrails(aiResponse: string): {
  clean: boolean
  sanitizedResponse: string
  flagged: boolean
} {
  let sanitizedResponse = aiResponse
  let flagged = false

  for (const pattern of PROHIBITED_OUTPUT_PATTERNS) {
    if (pattern.test(aiResponse)) {
      console.warn('[OutputGuardrail] Prohibited pattern detected — flagging response')
      flagged = true
      // Don't pass this response to the user — return a safe default
      sanitizedResponse = "I'm not able to fully respond to that, but I'd love to help you explore Scripture. What Bible question is on your heart?"
      break
    }
  }

  return { clean: !flagged, sanitizedResponse, flagged }
}

// ─── JAILBREAK DEFENSE RESPONSE ───────────────────────────────────────────────

export const JAILBREAK_RESPONSE = "I'm Emmaus, and I'm here to help you explore the Bible. I can't change my core configuration, but I'd love to help you with a Scripture question instead. What's on your heart today?"
