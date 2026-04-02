'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type TopbarPortalProps = { children: React.ReactNode }

export function TopbarPortal({ children }: TopbarPortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const target = document.getElementById('topbar-actions')
  if (!target) return null

  return createPortal(children, target)
}
