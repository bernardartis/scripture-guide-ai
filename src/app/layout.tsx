import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ScriptureGuide AI — Your Bible Study Companion',
  description:
    'AI-powered Bible study tool. Explore Scripture, understand original Greek and Hebrew word meanings, and find biblical guidance across all Christian denominations.',
  keywords: ['Bible study', 'Scripture', 'AI', 'Christian', 'Bible app', 'Greek Hebrew'],
  openGraph: {
    title: 'ScriptureGuide AI',
    description: 'Explore the Bible with confidence',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">{children}</body>
    </html>
  )
}
