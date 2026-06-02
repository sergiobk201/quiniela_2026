'use client'

export function LocalTime({ iso }: { iso: string }) {
  const d = new Date(iso)
  return (
    <span suppressHydrationWarning>
      {d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

export function LocalDate({ iso }: { iso: string }) {
  const d = new Date(iso)
  return (
    <span suppressHydrationWarning>
      {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
    </span>
  )
}

export function LocalDateTime({ iso }: { iso: string }) {
  const d = new Date(iso)
  return (
    <span suppressHydrationWarning>
      {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
      {d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}
