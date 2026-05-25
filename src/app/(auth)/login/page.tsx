'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        shouldCreateUser: false,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
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
          <p>🔒 Not invited yet? Contact the admin to get access</p>
        </div>
        <button
          onClick={() => { setSent(false); setEmail('') }}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Use a different email
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
          Enter your email to receive a sign-in link.{' '}
          <span className="text-foreground font-medium">Invite only.</span>
        </p>
      </div>

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
          {loading ? 'Sending link…' : 'Send magic link →'}
        </Button>
      </form>

      {/* How it works */}
      <div className="space-y-3 pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">How it works</p>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold shrink-0">1</span>
            Enter the email you were invited with
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold shrink-0">2</span>
            Click the link in your inbox — no password needed
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold shrink-0">3</span>
            Submit your predictions before June 4, 2026
          </li>
        </ol>
      </div>

      {/* Deadline nudge */}
      <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-600 dark:text-amber-400 font-medium">
        ⏰ Pre-tournament deadline: <strong>June 4, 2026</strong> — one week before kickoff
      </div>
    </div>
  )
}
