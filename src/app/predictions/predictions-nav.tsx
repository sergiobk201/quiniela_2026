'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function PredictionsNav() {
  const t = useTranslations('predictions')
  const pathname = usePathname()

  const LINKS = [
    { href: '/predictions/pre-tournament', label: t('preTournament') },
    { href: '/predictions/group-stage',    label: t('groups') },
    { href: '/predictions/r32',            label: t('r32') },
    { href: '/predictions/r16',            label: t('r16') },
    { href: '/predictions/qf',             label: t('qf') },
    { href: '/predictions/sf',             label: t('sf') },
    { href: '/predictions/3rd',            label: t('thirdPlace') },
    { href: '/predictions/final',          label: t('final') },
    { href: '/predictions/rebuy',          label: t('rebuy') },
    { href: '/predictions/receipt',        label: t('receipt') },
  ]

  return (
    <nav className="border-b bg-background print:hidden">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
