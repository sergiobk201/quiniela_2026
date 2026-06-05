import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import { Nav } from '@/components/nav'
import { ChampionTheme } from '@/components/champion-theme'
import { getUser, createClient } from '@/lib/supabase/server'
import './globals.css'

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Quiniela 2026',
  description: 'World Cup 2026 prediction game',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  let championCode: string | null = null
  try {
    const user = await getUser()
    if (user) {
      const supabase = await createClient()
      const { data } = await supabase
        .from('pre_tournament_predictions')
        .select('champion:teams!champion_team_id(code)')
        .eq('user_id', user.id)
        .maybeSingle()
      championCode = (data?.champion as unknown as { code: string } | null)?.code ?? null
    }
  } catch {
    // Not authenticated or DB unavailable — no theme applied
  }

  return (
    <html
      lang={locale}
      className={`${jakartaSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <ChampionTheme code={championCode} />
            <Nav locale={locale} />
            {children}
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
