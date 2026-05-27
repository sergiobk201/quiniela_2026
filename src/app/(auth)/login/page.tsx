'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { checkEmailExists, sendInviteRequest } from './actions'

type Result = 'sent_link' | 'sent_invite_request' | null
type PaymentTab = 'qr' | 'usdc'

const ETH_WALLET = '0x60e4BEBF3a6Ea300867a20Ba4fde37f0183caEE4'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const searchParams = useSearchParams()
  const linkExpired = searchParams.get('error') === 'auth'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentTab, setPaymentTab] = useState<PaymentTab>('qr')
  const [copied, setCopied] = useState(false)

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

  // Invite request sent to admin → payment screen
  if (result === 'sent_invite_request') {
    async function copyWallet() {
      await navigator.clipboard.writeText(ETH_WALLET)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-4xl">🙋</div>
          <h2 className="text-2xl font-bold">Request sent!</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            <span className="font-semibold text-foreground">{email}</span> isn&apos;t
            on the guest list yet. The admin is reviewing your request.
          </p>
        </div>

        {/* Payment prompt */}
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <p className="font-semibold">Pay your $10 entrance fee now</p>
          <p className="text-xs mt-1 opacity-80 leading-relaxed">
            Your invite will be sent once payment is confirmed. Choose your method below.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
          <button
            onClick={() => setPaymentTab('qr')}
            className={`flex-1 py-2 transition-colors ${
              paymentTab === 'qr'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            🇧🇴 Bolivian QR
          </button>
          <button
            onClick={() => setPaymentTab('usdc')}
            className={`flex-1 py-2 transition-colors border-l border-border ${
              paymentTab === 'usdc'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            💠 USDC on ETH
          </button>
        </div>

        {/* QR panel */}
        {paymentTab === 'qr' && (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl border border-border bg-white p-3">
              <Image
                src="/qr_bob.jpeg"
                alt="Bolivian QR payment code"
                width={220}
                height={220}
                className="rounded-lg"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Scan with your Bolivian banking app (Tigo Money, Banco Unión, etc.)
            </p>
          </div>
        )}

        {/* USDC panel */}
        {paymentTab === 'usdc' && (
          <div className="space-y-3">
            {/* ETH-only warning */}
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-xs text-destructive leading-relaxed">
              <span className="font-bold">⚠ Use the ETH network only</span> — sending
              USDC on any other network (Polygon, Arbitrum, Base, etc.) will result in
              permanently lost funds.
            </div>

            {/* Wallet address + copy */}
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Wallet address</p>
              <p className="font-mono text-xs break-all text-foreground select-all leading-relaxed">
                {ETH_WALLET}
              </p>
              <Button
                onClick={copyWallet}
                variant="outline"
                size="sm"
                className={`w-full text-xs transition-colors ${
                  copied
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : ''
                }`}
              >
                {copied ? '✓ Copied!' : 'Copy address'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Send exactly $10 USDC. Include your email in a memo if your wallet supports it.
            </p>
          </div>
        )}

        <button
          onClick={() => { setResult(null); setEmail(''); setPaymentTab('qr'); setCopied(false) }}
          className="w-full text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
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
