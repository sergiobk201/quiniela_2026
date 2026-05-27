'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { checkEmailExists, sendInviteRequest } from './actions'

type Result = 'sent_link' | 'sent_invite_request' | null

export default function LoginPage() {
  const searchParams = useSearchParams()
  const linkExpired = searchParams.get('error') === 'auth'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const exists = await checkEmailExists(email)

    if (exists) {
      // Known user — call signInWithOtp from browser so PKCE verifier
      // is stored in cookies and the callback route can exchange the code
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
          shouldCreateUser: false,
        },
      })
      if (otpError) {
        setError(otpError.message)
      } else {
        setResult('sent_link')
      }
    } else {
      // Unknown email — notify admin via server action
      const { ok } = await sendInviteRequest(email)
      if (ok) {
        setResult('sent_invite_request')
      } else {
        setError('Could not send request. Try again.')
      }
    }

    setLoading(false)
  }

  // Magic link sent to existing user
  if (result === 'sent_link') {
    return (
      <div className="space-y-6 text-center">
        <div className="text-5xl">📬</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Check your inbox</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We sent a magic link to{' '}
            <span className="font-semibold text-foreground">{email}</span>.
            Click it to enter the tournament.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground space-y-1 text-left">
          <p>⏱ Link expires in 60 minutes</p>
          <p>📁 Check your spam folder if you don&apos;t see it</p>
        </div>
        <button
          onClick={() => { setResult(null); setEmail('') }}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Use a different email
        </button>
      </div>
    )
  }

  // Invite request sent to admin
  if (result === 'sent_invite_request') {
    return (
      <div className="space-y-6 text-center">
        <div className="text-5xl">🙋</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Request sent!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            <span className="font-semibold text-foreground">{email}</span> isn&apos;t
            on the guest list yet. The admin has been notified and will send your
            invite shortly.
          </p>
        </div>
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-600 dark:text-amber-400 space-y-1 text-left">
          <p className="font-semibold">What happens next</p>
          <p className="text-xs leading-relaxed">
            The admin will review your request, collect the $10 entry fee, and send
            your magic link. Keep an eye on your inbox.
          </p>
        </div>
        <button
          onClick={() => { setResult(null); setEmail('') }}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Try a different email
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Branding */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-3xl">⚽</span>
          <span className="font-black text-xl tracking-tight">Quiniela 2026</span>
        </div>
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="text-muted-foreground text-sm">
          Enter your email to sign in or request an invite.
        </p>
      </div>

      {/* Expired / consumed link banner */}
      {linkExpired && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive space-y-1">
          <p className="font-semibold">Magic link expired or already used</p>
          <p className="text-xs leading-relaxed opacity-90">
            Email security scanners sometimes consume links before you click them.
            Enter your email below to get a fresh one.
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          autoFocus
          className="h-11"
        />
        {error && (
          <p className="text-destructive text-sm flex items-center gap-1.5">
            <span>⚠</span> {error}
          </p>
        )}
        <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
          {loading ? 'Checking…' : 'Continue →'}
        </Button>
      </form>

      {/* How it works */}
      <div className="space-y-3 pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">How it works</p>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold shrink-0">1</span>
            Enter your email — invited users get a magic link instantly
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold shrink-0">2</span>
            New? Your request goes to the admin — invite + $10 entry required
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold shrink-0">3</span>
            Submit your predictions before June 7, 2026
          </li>
        </ol>
      </div>

      {/* Deadline nudge */}
      <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-600 dark:text-amber-400 font-medium">
        ⏰ Pre-tournament deadline: <strong>June 7, 2026</strong> — four days before kickoff
      </div>
    </div>
  )
}
