import type { NextConfig } from 'next'

// Validate required env vars in production
if (process.env.NODE_ENV === 'production') {
  for (const key of ['AUTH_SECRET', 'ANTHROPIC_API_KEY'] as const) {
    if (!process.env[key]) throw new Error(`Missing required env var: ${key}`)
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ...(process.env.NODE_ENV === 'production'
          ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
          : []),
      ],
    }]
  },
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/dashboard', destination: '/chat', permanent: false },
    ]
  },
}

export default nextConfig
