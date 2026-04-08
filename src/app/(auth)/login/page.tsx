'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/chat'
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) { setError('Invalid email or password. Please try again.') }
      else { router.push(callbackUrl); router.refresh() }
    } catch { setError('Something went wrong. Please try again.') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
           style={{ background: 'linear-gradient(160deg, #0e1420 0%, #1a2438 50%, #0e1420 100%)' }}>
        <div className="absolute inset-0 opacity-07"
             style={{ backgroundImage: 'radial-gradient(circle, #2E3A59 1px, transparent 1px)', backgroundSize: '32px 32px' }}/>
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <svg width="300" height="300" viewBox="0 0 300 300" fill="none">
            <circle cx="150" cy="120" r="70" fill="#6a7a38"/>
            <circle cx="150" cy="120" r="35" fill="#f8f5ee"/>
            <path d="M150 190 C150 190 90 230 90 260 Q90 290 150 290 Q210 290 210 260 C210 230 150 190 150 190Z" fill="#6a7a38"/>
          </svg>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #1a2238, #2E3A59)', border: '1px solid rgba(74,106,153,0.5)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/>
              <circle cx="12" cy="10" r="3" fill="white" stroke="none"/>
            </svg>
          </div>
          <span className="font-medium" style={{ fontFamily: 'Lora, serif', color: '#d8e8b0' }}>Emmaus</span>
        </div>
        <div className="relative z-10 space-y-8">
          {[
            { ref: 'Luke 24:32', text: 'Were not our hearts burning within us while he talked with us on the road and opened the Scriptures to us?' },
            { ref: 'Matthew 11:28', text: 'Come to me, all you who are weary and burdened, and I will give you rest.' },
          ].map((v) => (
            <div key={v.ref} style={{ borderLeft: '2px solid rgba(74,106,153,0.5)', paddingLeft: '20px' }}>
              <p className="text-sm leading-relaxed italic" style={{ color: 'rgba(220,232,180,0.85)', fontFamily: 'Lora, serif' }}>
                &ldquo;{v.text}&rdquo;
              </p>
              <p className="text-xs mt-2" style={{ color: 'rgba(168,184,112,0.8)' }}>{v.ref}</p>
            </div>
          ))}
        </div>
        <p className="relative z-10 text-xs" style={{ color: 'rgba(138,144,96,0.6)' }}>
          Walk with the Word · Not a counseling service · Crisis: call or text 988
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 rounded-full flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #1a2238, #2E3A59)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3" fill="white" stroke="none"/>
              </svg>
            </div>
            <span className="font-semibold text-stone-800" style={{ fontFamily: 'Lora, serif' }}>Emmaus</span>
          </div>
          <h1 className="text-2xl font-semibold text-stone-900 mb-1" style={{ fontFamily: 'Lora, serif' }}>Welcome back</h1>
          <p className="text-sm text-stone-500 mb-8">Continue your walk with the Word</p>
          <button onClick={() => signIn('google', { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors mb-5"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.826.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--border)' }}/>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-stone-400" style={{ background: 'var(--bg-primary)' }}>or</span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all focus:ring-2 focus:ring-blue-700"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}/>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required autoComplete="current-password" placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all focus:ring-2 focus:ring-blue-700"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}/>
            </div>
            {error && (
              <div className="rounded-xl px-4 py-3 text-xs text-red-700 bg-red-50 border border-red-200">{error}</div>
            )}
            <button type="submit" disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all active:scale-95"
              style={{ background: isLoading ? '#4a6080' : 'linear-gradient(135deg, #1a2238, #2E3A59)' }}>
              {isLoading ? 'Signing in…' : 'Sign in to Emmaus'}
            </button>
          </form>
          <p className="text-center text-sm text-stone-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium hover:underline" style={{ color: '#2E3A59' }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#6a7a38', borderTopColor: 'transparent' }}/>
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  )
}
