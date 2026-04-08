import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Emmaus — Walk with the Word',
  description: 'Bring your questions, your struggles, and your doubts. Walk with the Word — wherever you are on the road. AI-powered Scripture guidance for believers, seekers, and pastors.',
  keywords: ['Bible study', 'Scripture', 'AI', 'Christian', 'faith', 'grief', 'anxiety', 'pastor'],
  openGraph: {
    title: 'Emmaus',
    description: 'Walk with the Word',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Emmaus',
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Emmaus" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#2E3A59" />
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
