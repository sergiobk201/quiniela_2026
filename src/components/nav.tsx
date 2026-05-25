import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { SignOutButton } from '@/components/sign-out-button'
import { NavLinks } from '@/components/nav-links'

export async function Nav() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.is_admin === true
  }

  return (
    <header className="border-b bg-background">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight">
          Quiniela 2026
        </Link>

        <div className="flex items-center gap-3">
          {user && <NavLinks isAdmin={isAdmin} />}
          <ThemeToggle />
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
