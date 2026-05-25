'use client'

import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button variant="outline" size="sm" type="submit">
        Sign out
      </Button>
    </form>
  )
}
