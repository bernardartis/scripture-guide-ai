'use client'

import { useState, useEffect } from 'react'
import type { BibleVersionCode, ExperienceLevel } from '@/types'

const VERSION_OPTIONS: { code: BibleVersionCode; label: string; free: boolean }[] = [
  { code: 'KJV',  label: 'KJV — King James Version',         free: true },
  { code: 'WEB',  label: 'WEB — World English Bible',         free: true },
  { code: 'BSB',  label: 'BSB — Berean Standard Bible',       free: true },
  { code: 'ASV',  label: 'ASV — American Standard Version',   free: true },
  { code: 'YLT',  label: "YLT — Young's Literal Translation", free: true },
  { code: 'ESV',  label: 'ESV — English Standard Version',    free: false },
  { code: 'NASB', label: 'NASB — New American Standard',      free: false },
  { code: 'NLT',  label: 'NLT — New Living Translation',      free: false },
  { code: 'CSB',  label: 'CSB — Christian Standard Bible',    free: false },
]

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; desc: string }[] = [
  { value: 'beginner',     label: 'Beginner',     desc: 'New to Bible study' },
  { value: 'growing',      label: 'Growing',      desc: 'Learning the basics' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Regular Bible reader' },
  { value: 'advanced',     label: 'Advanced',     desc: 'Deep study, some theology' },
  { value: 'scholar',      label: 'Scholar',      desc: 'Greek/Hebrew, seminary-level' },
]

export default function SettingsPage() {
  const [version, setVersion]       = useState<BibleVersionCode>('KJV')
  const [level, setLevel]           = useState<ExperienceLevel>('beginner')
  const [denomination, setDenomination] = useState('')
  const [churchMode, setChurchMode] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  // Consent state
  const [religiousConsent, setReligiousConsent] = useState(false)
  const [showConsentInfo, setShowConsentInfo]   = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setVersion(data.profile.preferredVersionCode ?? 'KJV')
          setLevel(data.profile.experienceLevel?.toLowerCase() ?? 'beginner')
          setDenomination(data.profile.denomination ?? '')
          setChurchMode(data.profile.churchModeEnabled ?? false)
        }
        if (data.religiousDataConsent !== undefined) {
          setReligiousConsent(data.religiousDataConsent)
        }
      })
      .catch(console.error)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version, level, denomination, churchMode }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data. This cannot be undone.')) return
    await fetch('/api/account', { method: 'DELETE' })
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Settings</h1>
        <p className="text-sm text-gray-500 mb-8">Manage your Bible study preferences and account.</p>

        {/* ── BIBLE PREFERENCES ─────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Bible preferences</h2>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Default translation
            </label>
            <select
              value={version}
              onChange={(e) => setVersion(e.target.value as BibleVersionCode)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <optgroup label="Free translations">
                {VERSION_OPTIONS.filter((v) => v.free).map((v) => (
                  <option key={v.code} value={v.code}>{v.label}</option>
                ))}
              </optgroup>
              <optgroup label="Believer plan required">
                {VERSION_OPTIONS.filter((v) => !v.free).map((v) => (
                  <option key={v.code} value={v.code}>{v.label}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Experience level
            </label>
            <div className="grid grid-cols-1 gap-2">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                    level === opt.value
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="level"
                    value={opt.value}
                    checked={level === opt.value}
                    onChange={() => setLevel(opt.value)}
                    className="accent-amber-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Denomination <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              placeholder="e.g. Baptist, Catholic, Non-denominational"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={churchMode}
              onChange={(e) => setChurchMode(e.target.checked)}
              className="h-4 w-4 rounded accent-amber-600"
            />
            <div>
              <div className="text-sm font-medium text-gray-800">Church mode</div>
              <div className="text-xs text-gray-500">Shorter responses for real-time sermon use</div>
            </div>
          </label>
        </section>

        {/* ── DATA & PRIVACY ────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-1">Data & privacy</h2>
          <p className="text-xs text-gray-500 mb-4">
            Your denomination preference and chat history are religious belief data, protected
            under GDPR Article 9 and California CPRA.{' '}
            <button
              onClick={() => setShowConsentInfo(!showConsentInfo)}
              className="text-amber-700 underline"
            >
              Learn more
            </button>
          </p>

          {showConsentInfo && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-900 leading-relaxed">
              We collect your denomination and chat history only with your explicit consent.
              This data is used solely to personalize your Bible study experience — it is
              never sold or shared with third parties. You may withdraw this consent at any
              time by unchecking the box below. Withdrawing consent will delete your stored
              denomination preference and chat history within 30 days.
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={religiousConsent}
              onChange={async (e) => {
                const newValue = e.target.checked
                setReligiousConsent(newValue)
                await fetch('/api/consent', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'religious_data', consented: newValue }),
                })
              }}
              className="mt-0.5 h-4 w-4 rounded accent-amber-600 flex-shrink-0"
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              Allow ScriptureGuide AI to store my denomination preference and chat history
              to personalize my Bible study experience.
            </span>
          </label>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <a
              href="/api/account/export"
              className="text-sm text-blue-600 hover:underline block mb-2"
            >
              Download my data (GDPR/CCPA right to access)
            </a>
            <a
              href="/copyright"
              className="text-sm text-gray-500 hover:underline block"
            >
              Bible translation copyrights
            </a>
          </div>
        </section>

        {/* ── SAVE BUTTON ───────────────────────────────────────────── */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-xl py-3 text-sm transition-colors mb-4"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save preferences'}
        </button>

        {/* ── DANGER ZONE ───────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-red-200 p-5">
          <h2 className="text-sm font-semibold text-red-700 mb-1">Danger zone</h2>
          <p className="text-xs text-gray-500 mb-4">
            Deleting your account permanently removes all your data including chat history,
            bookmarks, and preferences within 30 days (45 days for California residents).
          </p>
          <button
            onClick={handleDeleteAccount}
            className="text-sm text-red-600 border border-red-300 rounded-xl px-4 py-2 hover:bg-red-50 transition-colors"
          >
            Delete my account
          </button>
        </section>
      </div>
    </div>
  )
}
