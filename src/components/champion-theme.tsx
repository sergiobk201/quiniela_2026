'use client'

import { useEffect } from 'react'
import { getColors } from '@/lib/teams/meta'

function clamp(hex: string, isDark: boolean): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  if (isDark && lum < 0.12) {
    // Too dark for dark background — lift brightness
    const lift = 160
    const nr = Math.min(255, r + lift).toString(16).padStart(2, '0')
    const ng = Math.min(255, g + lift).toString(16).padStart(2, '0')
    const nb = Math.min(255, b + lift).toString(16).padStart(2, '0')
    return `#${nr}${ng}${nb}`
  }
  if (!isDark && lum > 0.82) {
    // Too light for light background — darken
    const f = 0.4
    const nr = Math.round(r * f).toString(16).padStart(2, '0')
    const ng = Math.round(g * f).toString(16).padStart(2, '0')
    const nb = Math.round(b * f).toString(16).padStart(2, '0')
    return `#${nr}${ng}${nb}`
  }
  return hex
}

export function applyChampionTheme(code: string | null): void {
  const root = document.documentElement
  if (!code) {
    root.style.removeProperty('--champion-primary')
    root.style.removeProperty('--champion-secondary')
    return
  }
  const isDark = root.classList.contains('dark')
  const [primary, secondary] = getColors(code)
  root.style.setProperty('--champion-primary', clamp(primary, isDark))
  root.style.setProperty('--champion-secondary', clamp(secondary, isDark))
}

export function ChampionTheme({ code }: { code: string | null }) {
  useEffect(() => {
    applyChampionTheme(code)

    function handleChange(e: Event) {
      const { code: newCode } = (e as CustomEvent<{ code: string | null }>).detail
      applyChampionTheme(newCode)
    }

    window.addEventListener('champion-changed', handleChange)
    return () => window.removeEventListener('champion-changed', handleChange)
  }, [code])

  return null
}
