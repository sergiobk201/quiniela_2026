'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Home, ClipboardList, Dices, Trophy, BookOpen, Settings } from 'lucide-react'

export function BottomNav({ isAdmin }: { isAdmin?: boolean }) {
  const t = useTranslations('nav')
  const pathname = usePathname()

  const links = [
    { href: '/dashboard',                  label: t('dashboard'),     icon: Home,          match: (p: string) => p === '/dashboard' },
    { href: '/predictions/pre-tournament', label: t('predictions'),   icon: ClipboardList, match: (p: string) => p.startsWith('/predictions') },
    { href: '/community-bets',             label: t('communityBets'), icon: Dices,         match: (p: string) => p.startsWith('/community-bets') },
    { href: '/leaderboard',                label: t('leaderboard'),   icon: Trophy,        match: (p: string) => p === '/leaderboard' },
    { href: '/rules',                      label: t('rules'),         icon: BookOpen,      match: (p: string) => p === '/rules' },
  ]

  const allLinks = isAdmin
    ? [...links, { href: '/admin', label: t('admin'), icon: Settings, match: (p: string) => p.startsWith('/admin') }]
    : links

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm"
      style={{ borderTopColor: 'color-mix(in oklch, var(--champion-primary) 35%, transparent)' }}
    >
      <div className="flex items-center justify-around h-16 px-1">
        {allLinks.map(({ href, label, icon: Icon, match }) => {
          const isActive = match(pathname)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0 flex-1 ${
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              style={isActive ? { color: 'var(--champion-primary, inherit)' } : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium truncate w-full text-center leading-tight">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
