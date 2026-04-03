'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Referencia } from '@/lib/types'

type ReferenciaCardProps = {
  referencia: Referencia
  onClick: (ref: Referencia) => void
}

export function ReferenciaCard({ referencia, onClick }: ReferenciaCardProps) {
  const [src, setSrc]         = useState<string | undefined>(undefined)
  const [hovered, setHovered] = useState(false)
  const containerRef          = useRef<HTMLDivElement>(null)

  // Lazy load: só define src quando entra no viewport
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSrc(`/api/serve/referencias/${referencia.id}/index.html`)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [referencia.id])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer',
        hovered ? 'border-border-hi -translate-y-0.5' : 'border-border-default'
      )}
      style={{
        aspectRatio: '16/10',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(referencia)}
    >
      {/* iframe preview */}
      {src ? (
        <iframe
          src={src}
          title={referencia.nome}
          sandbox="allow-scripts allow-same-origin"
          className="w-full h-full border-0 pointer-events-none"
          style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
        />
      ) : (
        <div className="w-full h-full bg-elevated flex items-center justify-center">
          <span className="font-mono text-[10px] text-text-3 uppercase tracking-[1.5px]">Carregando...</span>
        </div>
      )}

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex flex-col items-start justify-end p-3 transition-opacity duration-200"
        style={{
          background: 'linear-gradient(to top, rgba(7,9,15,0.92) 0%, rgba(7,9,15,0.4) 50%, transparent 100%)',
          opacity: hovered ? 1 : 0,
        }}
      >
        <p className="font-syne font-bold text-[13px] text-text-1 leading-tight line-clamp-1 mb-1.5">
          {referencia.nome}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="px-2 py-0.5 rounded-full font-mono text-[9px] tracking-wide"
            style={{ background: 'rgba(240,180,41,0.12)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.2)' }}
          >
            {referencia.niche}
          </span>
          <span
            className="px-2 py-0.5 rounded-full font-mono text-[9px] tracking-wide text-text-3"
            style={{ background: 'rgba(30,43,60,0.8)', border: '1px solid rgba(30,43,60,0.8)' }}
          >
            {referencia.page_type}
          </span>
        </div>
      </div>
    </div>
  )
}
