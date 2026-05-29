'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('login')
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
      const { ok } = await sendInviteRequest(email)
      if (ok) {
        setResult('sent_invite_request')
      } else {
        setError(t('sendError'))
      }
    }

    setLoading(false)
  }

  if (result === 'sent_link') {
    return (
      <div className="space-y-6 text-center">
        <div className="text-5xl">📬</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{t('sentLinkTitle')}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t('sentLinkBody', { email })}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground space-y-1 text-left">
          <p>{t('linkExpires')}</p>
          <p>{t('checkSpam')}</p>
        </div>
        <button
          onClick={() => { setResult(null); setEmail('') }}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          {t('tryDifferentEmail')}
        </button>
      </div>
    )
  }

  if (result === 'sent_invite_request') {
    async function copyWallet() {
      await navigator.clipboard.writeText(ETH_WALLET)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">🙋</div>
          <h2 className="text-2xl font-bold">{t('requestSentTitle')}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t('requestSentBody', { email })}
          </p>
        </div>

        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <p className="font-semibold">{t('payNow')}</p>
          <p className="text-xs mt-1 opacity-80 leading-relaxed">{t('payNowSub')}</p>
        </div>

        <div className="flex rounded-lg border border-border overflow-hidden text-sm font-medium">
          <button
            onClick={() => setPaymentTab('qr')}
            className={`flex-1 py-2 transition-colors ${
              paymentTab === 'qr'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            {t('bolivianQr')}
          </button>
          <button
            onClick={() => setPaymentTab('usdc')}
            className={`flex-1 py-2 transition-colors border-l border-border ${
              paymentTab === 'usdc'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            {t('usdcEth')}
          </button>
        </div>

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
              {t('qrHint')}
            </p>
          </div>
        )}

        {paymentTab === 'usdc' && (
          <div className="space-y-3">
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-xs text-destructive leading-relaxed">
              <span className="font-bold">{t('ethWarningTitle')}</span> — {t('ethWarningBody')}
            </div>

            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('walletAddress')}</p>
              <p className="font-mono text-xs break-all text-foreground select-all leading-relaxed">
                {ETH_WALLET}
              </p>
              <Button
                onClick={copyWallet}
                variant="outline"
                size="sm"
                className={`w-full text-xs transition-colors ${
                  copied ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : ''
                }`}
              >
                {copied ? t('copied') : t('copyAddress')}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {t('usdcHint')}
            </p>
          </div>
        )}

        <button
          onClick={() => { setResult(null); setEmail(''); setPaymentTab('qr'); setCopied(false) }}
          className="w-full text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          {t('tryDifferentEmail')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-3xl">⚽</span>
          <span className="font-black text-xl tracking-tight">{t('title')}</span>
        </div>
        <h2 className="text-2xl font-bold">{t('welcomeBack')}</h2>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>

      {linkExpired && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive space-y-1">
          <p className="font-semibold">{t('linkExpiredTitle')}</p>
          <p className="text-xs leading-relaxed opacity-90">{t('linkExpiredBody')}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder={t('emailPlaceholder')}
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
          {loading ? t('checking') : t('continue')}
        </Button>
      </form>

      <div className="space-y-3 pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('howItWorksTitle')}</p>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold shrink-0">1</span>
            {t('step1')}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold shrink-0">2</span>
            {t('step2')}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold shrink-0">3</span>
            {t('step3')}
          </li>
        </ol>
      </div>

      <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-600 dark:text-amber-400 font-medium">
        ⏰ {t('deadline', { date: 'June 7, 2026' })}
      </div>
    </div>
  )
}
