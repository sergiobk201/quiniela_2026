'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Trophy, Lock, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin/users',   label: 'Users',   icon: Users },
  { href: '/admin/matches', label: 'Matches', icon: Trophy },
  { href: '/admin/locks',   label: 'Locks',   icon: Lock },
  { href: '/admin/audit',   label: 'Audit',   icon: FileText },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <aside className="w-52 shrink-0 border-r min-h-full bg-muted/20">
      <nav className="p-3 space-y-1">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Admin
        </p>
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
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
