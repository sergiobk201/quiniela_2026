'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setLocale } from '@/app/actions/locale'

export function LocaleToggle({ locale }: { locale: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggle() {
    const next = locale === 'en' ? 'es' : 'en'
    startTransition(async () => {
      await setLocale(next)
      router.refresh()
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="text-xs font-semibold px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
      aria-label="Toggle language"
    >
      {locale === 'en' ? 'ES' : 'EN'}
    </button>
  )
}
