'use client'

import { useEffect } from 'react'
import { getColors } from '@/lib/teams/meta'

export function ChampionTheme({ code }: { code: string | null }) {
  useEffect(() => {
    const root = document.documentElement
    if (!code) {
      root.style.removeProperty('--champion-primary')
      root.style.removeProperty('--champion-secondary')
      return
    }
    const [primary, secondary] = getColors(code)
    root.style.setProperty('--champion-primary', primary)
    root.style.setProperty('--champion-secondary', secondary)
  }, [code])

  return null
}
