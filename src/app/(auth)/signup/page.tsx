'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()

  const [step, setStep] = useState<'details' | 'consent'>('details')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Consent checkboxes (step 2)
  const [tosConsent, setTosConsent] = useState(false)
  const [religiousDataConsent, setReligiousDataConsent] = useState(false)

  // ── AGE VALIDATION ────────────────────────────────────────────────────

  const calculateAge = (dobString: string): number => {
    const today = new Date()
    const birth = new Date(dobString)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!dob) {
      setError('Date of birth is required.')
      return
    }

    const age = calculateAge(dob)

    // COPPA: block under-13 entirely
    if (age < 13) {
      setError('ScriptureGuide AI requires users to be at least 13 years old.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setStep('consent')
  }

  const handleConsentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!tosConsent) {
      setError('You must accept the Terms of Service to continue.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          dob,
          tosConsent,
          religiousDataConsent,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Signup failed. Please try again.')
        return
      }

      // Auto sign-in after successful signup
      await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      router.push('/chat')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto mb-3">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#92650a" strokeWidth="1.5">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Free forever — no credit card required</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

          {/* Step 1 — Account details */}
          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date of birth <span className="text-gray-400 font-normal">(required — users must be 13+)</span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl py-2.5 text-sm transition-colors mt-1"
              >
                Continue
              </button>
            </form>
          )}

          {/* Step 2 — Consent (GDPR / CCPA compliant) */}
          {step === 'consent' && (
            <form onSubmit={handleConsentSubmit} className="space-y-4">
              <p className="text-sm text-gray-700 font-medium">
                Before we create your account, please review and confirm:
              </p>

              {/* ToS consent — required */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tosConsent}
                  onChange={(e) => setTosConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 flex-shrink-0"
                />
                <span className="text-xs text-gray-700 leading-relaxed">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-amber-700 underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" className="text-amber-700 underline">Privacy Policy</a>.
                  {' '}<span className="text-red-500">*</span>
                </span>
              </label>

              {/* Religious data consent — optional but explicit (GDPR Art. 9) */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={religiousDataConsent}
                    onChange={(e) => setReligiousDataConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 flex-shrink-0"
                  />
                  <span className="text-xs text-amber-900 leading-relaxed">
                    <strong>Optional:</strong> I consent to ScriptureGuide AI storing my denomination preference
                    and chat history to personalize my Bible study experience. This is religious belief data
                    protected under GDPR Article 9 and California CPRA. You can withdraw this consent
                    at any time in Settings.
                  </span>
                </label>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                ScriptureGuide AI is a Bible reference tool, not a counseling service. For mental health emergencies, call or text <strong>988</strong>.
              </p>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="flex-1 border border-gray-300 text-gray-700 font-medium rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !tosConsent}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-medium rounded-xl py-2.5 text-sm transition-colors"
                >
                  {isLoading ? 'Creating account…' : 'Create account'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-amber-700 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
