'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Lock, LockOpen } from 'lucide-react'

interface LockCardProps {
  label: string
  total: number
  locked: number
  onLock: () => Promise<void>
  onUnlock: () => Promise<void>
  isPreTournament?: boolean
}

function StatusPill({ locked, total }: { locked: number; total: number }) {
  if (total === 0) return <span className="text-xs text-muted-foreground">No matches</span>

  const allLocked = locked === total
  const allOpen = locked === 0

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        allLocked
          ? 'bg-red-500/20 text-red-400'
          : allOpen
          ? 'bg-green-500/20 text-green-400'
          : 'bg-yellow-500/20 text-yellow-400'
      }`}
    >
      {allLocked ? 'All locked' : allOpen ? 'All open' : `${locked} / ${total} locked`}
    </span>
  )
}

export function LockCard({ label, total, locked, onLock, onUnlock, isPreTournament }: LockCardProps) {
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleLock() {
    setConfirmOpen(false)
    startTransition(async () => {
      try {
        await onLock()
        toast.success(`${label} locked`)
      } catch {
        toast.error('Failed to lock')
      }
    })
  }

  function handleUnlock() {
    startTransition(async () => {
      try {
        await onUnlock()
        toast.success(`${label} unlocked`)
      } catch {
        toast.error('Failed to unlock')
      }
    })
  }

  return (
    <div className="border rounded-lg p-4 flex items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="font-medium text-sm">{label}</p>
        {!isPreTournament && (
          <StatusPill locked={locked} total={total} />
        )}
        {isPreTournament && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            locked > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {locked > 0 ? `${locked} locked` : 'Open'}
          </span>
        )}
      </div>

      <div className="flex gap-2 shrink-0">
        {/* Unlock / Reset */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleUnlock}
          disabled={pending}
          className="gap-1.5"
        >
          <LockOpen className="h-3.5 w-3.5" />
          {isPreTournament ? 'Unlock' : 'Reset'}
        </Button>

        {/* Lock — requires confirmation */}
        <Button
          variant="destructive"
          size="sm"
          disabled={pending}
          className="gap-1.5"
          onClick={() => setConfirmOpen(true)}
        >
          <Lock className="h-3.5 w-3.5" />
          Lock
        </Button>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lock {label}?</DialogTitle>
              <DialogDescription>
                This sets <code>locked_at = NOW()</code> for{' '}
                {isPreTournament
                  ? 'all pre-tournament predictions'
                  : `all ${total} matches in this stage`}
                . Users will immediately lose the ability to submit or edit predictions.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleLock} disabled={pending}>
                Yes, lock now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
