'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTheme } from '@/lib/theme'

const NAV_ITEMS = [
  {
    href: '/chat',
    label: 'Bible study',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/>
        <circle cx="12" cy="10" r="3" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
  },
  {
    href: '/billing',
    label: 'Plan & billing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
      </svg>
    ),
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

      <aside className="hidden md:flex flex-col w-60 flex-shrink-0"
             style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                 style={{ background: 'var(--accent-grad)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3" fill="white" stroke="none"/>
              </svg>
            </div>
            <span className="text-sm font-medium leading-tight" style={{ fontFamily: 'Lora, serif', color: 'var(--ink)' }}>
              Emmaus<br/>
              <span className="text-xs font-normal" style={{ color: 'var(--ink-faint)' }}>Walk with the Word</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors"
                style={isActive
                  ? { background: 'rgba(106,122,56,0.12)', color: 'var(--accent-deep)' }
                  : { color: 'var(--ink-muted)' }}>
                <span style={{ color: isActive ? 'var(--accent)' : 'var(--ink-faint)' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={toggle}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors"
            style={{ color: 'var(--ink-muted)' }}>
            <span style={{ color: 'var(--ink-faint)', fontSize: '16px' }}>
              {theme === 'dark' ? '☀' : '☽'}
            </span>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <Link href="/copyright"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors"
            style={{ color: 'var(--ink-faint)' }}>
            Bible copyrights
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors"
            style={{ color: 'var(--ink-muted)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-faint)' }}>
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
           style={{ background: 'var(--sidebar-bg)', borderTop: '1px solid var(--border)' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors"
              style={{ color: isActive ? 'var(--accent)' : 'var(--ink-faint)' }}>
              {item.icon}
              {item.label}
            </Link>
          )
        })}
        <button onClick={toggle}
          className="flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors"
          style={{ color: 'var(--ink-faint)' }}>
          <span style={{ fontSize: '18px', lineHeight: '1' }}>{theme === 'dark' ? '☀' : '☽'}</span>
          Theme
        </button>
        <button onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors"
          style={{ color: 'var(--ink-faint)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Sign out
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto flex flex-col">
        {children}
      </main>
    </div>
  )
}
