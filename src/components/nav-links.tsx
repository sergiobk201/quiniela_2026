'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function NavLinks({ isAdmin }: { isAdmin?: boolean }) {
  const t = useTranslations('nav')
  const pathname = usePathname()

  const links = [
    { href: '/dashboard',                  label: t('dashboard'),      match: (p: string) => p === '/dashboard' },
    { href: '/predictions/pre-tournament', label: t('predictions'),    match: (p: string) => p.startsWith('/predictions') },
    { href: '/community-bets',             label: t('communityBets'),  match: (p: string) => p.startsWith('/community-bets') },
    { href: '/leaderboard',                label: t('leaderboard'),    match: (p: string) => p === '/leaderboard' },
    { href: '/rules',                      label: t('rules'),          match: (p: string) => p === '/rules' },
  ]

  const allLinks = isAdmin
    ? [...links, { href: '/admin', label: t('admin'), match: (p: string) => p.startsWith('/admin') }]
    : links

  return (
    <nav className="hidden sm:flex items-center gap-4 text-sm">
      {allLinks.map(({ href, label, match }) => {
        const isActive = match(pathname)
        return (
          <Link
            key={href}
            href={href}
            className={`transition-colors ${isActive ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
            style={isActive ? { color: 'var(--champion-primary, inherit)' } : undefined}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
