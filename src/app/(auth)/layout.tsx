import Image from 'next/image'
import { getTranslations, getLocale } from 'next-intl/server'
import { LocaleToggle } from '@/components/locale-toggle'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('authLayout')
  const locale = await getLocale()

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Left panel — stadium hero */}
      <div className="relative md:flex-1 h-56 md:h-auto overflow-hidden">
        <Image
          src="/stadium-hero.png"
          alt="World Cup 2026 stadium"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-black/85 via-black/70 to-black/30" />

        <div className="relative z-10 flex flex-col justify-end md:justify-center h-full p-8 md:p-12 text-white">
          <div className="max-w-md space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}>⚽</span>
              <span
                className="text-sm font-semibold tracking-widest uppercase"
                style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
              >
                Quiniela 2026
              </span>
            </div>

            <div className="space-y-3">
              <h1
                className="text-4xl md:text-5xl font-black leading-tight tracking-tight"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
              >
                {t('tagline')}{' '}
                <span className="text-amber-400">{t('taglineHighlight')}</span>
              </h1>
              <p
                className="text-base md:text-lg leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
              >
                {t('description')}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['stat1', 'stat2', 'stat3', 'stat4'] as const).map((key) => (
                <span
                  key={key}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-black/40 border border-white/25 backdrop-blur-md text-white"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  {t(key)}
                </span>
              ))}
            </div>

            <div
              className="flex items-center gap-4 pt-2 rounded-xl px-4 py-3"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
            >
              <div className="relative w-12 h-12 shrink-0">
                <Image src="/trophy.png" alt="World Cup trophy" fill className="object-contain drop-shadow-lg" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  {t('tournamentName')}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                  {t('tournamentDates')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex items-start md:items-center justify-center bg-background md:w-[420px] shrink-0 p-8 md:p-12 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Locale toggle — top right of form panel */}
          <div className="flex justify-end mb-4">
            <LocaleToggle locale={locale} />
          </div>
          {children}
        </div>
      </div>

    </div>
  )
}
