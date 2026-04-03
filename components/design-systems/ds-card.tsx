'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { DesignSystem, DsStatus } from '@/lib/types'

type DsCardProps = {
  ds: DesignSystem
  onClick: (id: string) => void
}

const STATUS_CONFIG: Record<DsStatus, {
  label: string
  dotColor: string
  textColor: string
  bg: string
  pulse?: boolean
}> = {
  pending: {
    label: 'Aguardando',
    dotColor: '#4A5568',
    textColor: '#8896A8',
    bg: 'rgba(30,43,60,0.6)',
  },
  processing: {
    label: 'Extraindo...',
    dotColor: '#F0B429',
    textColor: '#F0B429',
    bg: 'rgba(240,180,41,0.08)',
    pulse: true,
  },
  done: {
    label: 'Concluído',
    dotColor: '#00D4AA',
    textColor: '#00D4AA',
    bg: 'rgba(0,212,170,0.08)',
  },
  error: {
    label: 'Erro',
    dotColor: '#F56565',
    textColor: '#F56565',
    bg: 'rgba(245,101,101,0.08)',
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function DsCard({ ds, onClick }: DsCardProps) {
  const [hovered, setHovered] = useState(false)
  const status = STATUS_CONFIG[ds.status]

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border transition-all duration-200 cursor-pointer',
        'bg-elevated',
        hovered ? '-translate-y-0.5' : 'translate-y-0'
      )}
      style={{
        borderColor: hovered ? '#263648' : '#1E2B3C',
        boxShadow: hovered
          ? '0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(38,54,72,0.5)'
          : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(ds.id)}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-4 right-4 h-px rounded-full transition-opacity duration-300"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(240,180,41,0.15), transparent)',
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        {/* Status badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: status.bg }}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full flex-shrink-0',
              status.pulse && 'animate-pulse'
            )}
            style={{ backgroundColor: status.dotColor }}
          />
          <span
            className="font-mono text-[9px] uppercase tracking-[1.5px]"
            style={{ color: status.textColor }}
          >
            {status.label}
          </span>
        </div>

        {/* DS watermark */}
        <span className="font-mono text-[9px] text-text-3 opacity-40 uppercase tracking-widest">
          DS
        </span>
      </div>

      {/* Body */}
      <div className="px-4 pb-3 flex-1">
        <h3 className="font-syne font-bold text-[14px] text-text-1 leading-snug line-clamp-2">
          {ds.nome}
        </h3>
        {ds.status === 'error' && ds.error_msg && (
          <p className="mt-1 font-mono text-[11px] text-red-lp/70 line-clamp-2">
            {ds.error_msg}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(30,43,60,0.5)' }}
      >
        <span className="font-mono text-[10px] text-text-3 opacity-60">
          {formatDate(ds.created_at)}
        </span>
        <span
          className="font-mono text-[9px] uppercase tracking-wider transition-opacity duration-200"
          style={{ color: '#F0B429', opacity: hovered ? 0.8 : 0.3 }}
        >
          Ver →
        </span>
      </div>
    </div>
  )
}
