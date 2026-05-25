'use client'

import { useRef, useTransition } from 'react'
import { inviteUser } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function InviteForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await inviteUser(formData)
        toast.success('Invite sent')
        formRef.current?.reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to invite user')
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex gap-2 flex-wrap">
      <Input
        name="displayName"
        placeholder="Display name"
        required
        disabled={pending}
        className="w-44"
      />
      <Input
        name="email"
        type="email"
        placeholder="email@example.com"
        required
        disabled={pending}
        className="w-64"
      />
      <Button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Send invite'}
      </Button>
    </form>
  )
}
