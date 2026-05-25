import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
      <p className="text-6xl font-bold text-muted-foreground/30">404</p>
      <h2 className="text-xl font-bold">Page not found</h2>
      <p className="text-muted-foreground text-sm">
        This page doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="text-sm text-primary hover:underline"
      >
        Go to dashboard →
      </Link>
    </div>
  )
}
