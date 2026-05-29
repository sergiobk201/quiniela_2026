import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
      <p className="text-6xl font-bold text-muted-foreground/30">404</p>
      <h2 className="text-xl font-bold">{t('title')}</h2>
      <Link href="/dashboard" className="text-sm text-primary hover:underline">
        {t('back')} →
      </Link>
    </div>
  )
}
