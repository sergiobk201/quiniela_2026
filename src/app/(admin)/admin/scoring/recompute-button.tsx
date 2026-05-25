'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { recomputeScores } from './actions'

export default function RecomputeButton() {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        const result = await recomputeScores('all')
        toast.success(`Scores updated — ${result.usersUpdated} users`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  return (
    <Button onClick={handleClick} disabled={pending}>
      {pending ? 'Computing…' : 'Recompute All Scores'}
    </Button>
  )
}
