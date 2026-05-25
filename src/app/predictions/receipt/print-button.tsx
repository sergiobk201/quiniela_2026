'use client'

import { Button } from '@/components/ui/button'

export default function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      Save as PDF
    </Button>
  )
}
