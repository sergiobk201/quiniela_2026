import Link from 'next/link'
import { getUser } from '@/lib/supabase/server'
import { getIsAdmin } from '@/lib/supabase/admin'
import { ThemeToggle } from '@/components/theme-toggle'
import { SignOutButton } from '@/components/sign-out-button'
import { NavLinks } from '@/components/nav-links'
import { LocaleToggle } from '@/components/locale-toggle'

export async function Nav({ locale }: { locale: string }) {
  const user = await getUser()
  const isAdmin = user ? await getIsAdmin(user.id) : false

  return (
    <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50" style={{ borderBottomColor: 'color-mix(in oklch, var(--champion-primary) 35%, transparent)' }}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl leading-none">⚽</span>
          <span
            className="font-black text-base tracking-tight"
            style={{
              background: 'linear-gradient(135deg, var(--champion-primary), var(--champion-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              transition: 'background 0.7s ease',
            }}
          >
            Quiniela
          </span>
          <span className="font-light text-base tracking-tight text-muted-foreground">
            2026
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <>
              <div className="hidden sm:block w-px h-5 bg-border" />
              <NavLinks isAdmin={isAdmin} />
            </>
          )}
          <LocaleToggle locale={locale} />
          {user && <ThemeToggle />}
          {user && (
            <>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <SignOutButton />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
