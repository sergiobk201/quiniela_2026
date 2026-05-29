'use client'

import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'
import { useTranslations } from 'next-intl'

export function SignOutButton() {
  const t = useTranslations('common')

  return (
    <form action={signOut}>
      <Button variant="outline" size="sm" type="submit">
        {t('signOut')}
      </Button>
    </form>
  )
}
