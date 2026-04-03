'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface SubscriptionData {
  planTier: string
  status: string
  currentPeriodEnd?: string
}

const PLAN_DISPLAY: Record<string, { name: string; price: string; features: string[] }> = {
  FREE: {
    name: 'Explorer (Free)',
    price: '$0/month',
    features: ['KJV, WEB, BSB translations', 'Basic Greek/Hebrew', '20 AI questions/day'],
  },
  BELIEVER: {
    name: 'Believer',
    price: '$4.99/month',
    features: ['All translations', 'Full Greek/Hebrew', 'Church mode', 'Unlimited questions', 'Community board'],
  },
  CHURCH: {
    name: 'Church',
    price: '$49/month',
    features: ['Everything in Believer', 'Up to 50 members', 'Sermon builder', 'Admin dashboard'],
  },
}

function BillingPageInner() {
  const searchParams = useSearchParams()
  const success   = searchParams.get('success')
  const cancelled = searchParams.get('cancelled')

  const [sub, setSub]         = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/billing/subscription')
      .then((r) => r.json())
      .then((d) => { setSub(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan)
    const res  = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setUpgrading(null)
  }

  const handleManage = async () => {
    const res  = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const currentPlan = sub?.planTier ?? 'FREE'
  const planInfo    = PLAN_DISPLAY[currentPlan]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Billing</h1>
        <p className="text-sm text-gray-500 mb-8">Manage your subscription plan.</p>

        {/* Success / cancel banners */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 mb-4">
            Your subscription has been activated. Welcome to {planInfo?.name}!
          </div>
        )}
        {cancelled && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 mb-4">
            Checkout was cancelled — no charge was made.
          </div>
        )}

        {/* Current plan */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Current plan</h2>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{planInfo?.name}</p>
              <p className="text-sm text-gray-500">{planInfo?.price}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              sub?.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {sub?.status ?? 'Free'}
            </span>
          </div>

          {sub?.currentPeriodEnd && (
            <p className="text-xs text-gray-400 mt-3">
              Renews {new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}

          <ul className="mt-4 space-y-1.5">
            {planInfo?.features.map((f) => (
              <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="text-green-500 text-xs">✓</span> {f}
              </li>
            ))}
          </ul>

          {currentPlan !== 'FREE' && (
            <button
              onClick={handleManage}
              className="mt-4 w-full border border-gray-300 text-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              Manage subscription / Cancel
            </button>
          )}
        </section>

        {/* Upgrade options */}
        {currentPlan === 'FREE' && (
          <>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Upgrade your plan</h2>

            {/* Believer */}
            <section className="bg-white rounded-2xl border-2 border-amber-400 p-5 mb-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">Most popular</span>
                  <p className="text-base font-semibold text-gray-900 mt-1">Believer</p>
                </div>
                <p className="text-lg font-semibold text-gray-900">$4.99<span className="text-sm font-normal text-gray-500">/mo</span></p>
              </div>
              <ul className="space-y-1.5 mb-4">
                {PLAN_DISPLAY.BELIEVER.features.map((f) => (
                  <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500 text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade('believer_monthly')}
                disabled={upgrading === 'believer_monthly'}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-medium rounded-xl py-2.5 text-sm transition-colors"
              >
                {upgrading === 'believer_monthly' ? 'Redirecting…' : 'Upgrade to Believer'}
              </button>
            </section>

            {/* Church */}
            <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-base font-semibold text-gray-900">Church plan</p>
                <p className="text-lg font-semibold text-gray-900">$49<span className="text-sm font-normal text-gray-500">/mo</span></p>
              </div>
              <ul className="space-y-1.5 mb-4">
                {PLAN_DISPLAY.CHURCH.features.map((f) => (
                  <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500 text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade('church_monthly')}
                disabled={upgrading === 'church_monthly'}
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl py-2.5 text-sm transition-colors"
              >
                {upgrading === 'church_monthly' ? 'Redirecting…' : 'Upgrade to Church plan'}
              </button>
            </section>
          </>
        )}

        {/* FTC disclosure */}
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Subscriptions renew automatically. Cancel anytime via "Manage subscription" above — cancellation takes effect at the end of the current billing period.{' '}
          <a href="/terms" className="underline">Terms of Service</a>
        </p>
      </div>
    </div>
  )
}
export default function BillingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <BillingPageInner />
    </Suspense>
  )
}
