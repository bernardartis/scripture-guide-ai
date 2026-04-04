import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ScriptureGuide AI — Your Bible Study Companion',
  description: 'AI-powered Bible study tool. Explore Scripture, understand original Greek and Hebrew word meanings, and find biblical guidance across all Christian denominations.',
  keywords: ['Bible study', 'Scripture', 'AI', 'Christian', 'Bible app', 'Greek Hebrew'],
  openGraph: {
    title: 'ScriptureGuide AI',
    description: 'Explore the Bible with confidence',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ScriptureGuide AI',
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ScriptureGuide AI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#c05e10" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
