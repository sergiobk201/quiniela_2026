'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard',                  label: 'Dashboard',   match: (p: string) => p === '/dashboard' },
  { href: '/predictions/pre-tournament', label: 'Predictions', match: (p: string) => p.startsWith('/predictions') },
  { href: '/leaderboard',                label: 'Leaderboard', match: (p: string) => p === '/leaderboard' },
  { href: '/rules',                      label: 'Rules',       match: (p: string) => p === '/rules' },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="hidden sm:flex items-center gap-4 text-sm">
      {links.map(({ href, label, match }) => {
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
