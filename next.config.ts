import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://*.supabase.co'
const supabaseHost = supabaseUrl.startsWith('https://') ? supabaseUrl : 'https://*.supabase.co'
const supabaseWs = supabaseHost.replace('https://', 'wss://')

const csp = [
  "default-src 'self'",
  // Next.js RSC hydration and inline event handlers require unsafe-inline
  "script-src 'self' 'unsafe-inline'",
  // Tailwind + shadcn/ui use inline styles extensively
  "style-src 'self' 'unsafe-inline'",
  // Geist font is self-hosted under /_next/static/media/
  "font-src 'self'",
  // No external images — stadium hero and icons are all /public assets
  "img-src 'self' data: blob:",
  // Supabase REST, Auth, Storage, and Edge Functions (HTTP + WebSocket for Realtime)
  `connect-src 'self' ${supabaseHost} ${supabaseWs}`,
  // Belt-and-suspenders alongside X-Frame-Options: DENY
  "frame-ancestors 'none'",
  // Prevent base-tag hijacking
  "base-uri 'self'",
  // Lock form submissions to same origin
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}

export default withNextIntl(nextConfig)
