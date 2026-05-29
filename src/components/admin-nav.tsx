'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Users, Trophy, Lock, FileText, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminNav() {
  const t = useTranslations('admin.nav')
  const pathname = usePathname()

  const links = [
    { href: '/admin/users',   label: t('users'),   icon: Users },
    { href: '/admin/matches', label: t('matches'),  icon: Trophy },
    { href: '/admin/locks',   label: t('locks'),    icon: Lock },
    { href: '/admin/audit',   label: t('audit'),    icon: FileText },
    { href: '/admin/scoring', label: t('scoring'),  icon: Calculator },
  ]

  return (
    <aside className="border-b lg:border-b-0 lg:border-r lg:w-52 lg:shrink-0 lg:min-h-full bg-muted/20">
      <nav className="flex lg:flex-col gap-1 overflow-x-auto p-3 lg:space-y-1">
        <p className="hidden lg:block px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
          Admin
        </p>
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex shrink-0 items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
