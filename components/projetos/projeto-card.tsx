'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Projeto, ProjetoStatus } from '@/lib/types'

type ProjetoCardProps = {
  projeto: Projeto
  clienteNome: string
  onEdit: (projeto: Projeto) => void
  onDelete: (projeto: Projeto) => void
}

const STATUS_CONFIG: Record<ProjetoStatus, {
  label: string
  dotColor: string
  textColor: string
  bg: string
  pulse?: boolean
}> = {
  rascunho: {
    label: 'Rascunho',
    dotColor: '#4A5568',
    textColor: '#8896A8',
    bg: 'rgba(30,43,60,0.6)',
  },
  gerando: {
    label: 'Gerando',
    dotColor: '#F0B429',
    textColor: '#F0B429',
    bg: 'rgba(240,180,41,0.08)',
    pulse: true,
  },
  concluido: {
    label: 'Concluído',
    dotColor: '#00D4AA',
    textColor: '#00D4AA',
    bg: 'rgba(0,212,170,0.08)',
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function ProjetoCard({ projeto, clienteNome, onEdit, onDelete }: ProjetoCardProps) {
  const [hovered, setHovered] = useState(false)
  const status = STATUS_CONFIG[projeto.status]

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border transition-all duration-200 cursor-default',
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

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            role="button"
            aria-label="Editar"
            onClick={() => onEdit(projeto)}
            className="h-6 px-2.5 text-[10px] font-mono text-text-3 border border-transparent rounded-md hover:border-border-default hover:text-text-2 transition-all duration-150"
          >
            Editar
          </button>
          <button
            role="button"
            aria-label="Deletar"
            onClick={() => onDelete(projeto)}
            className="h-6 px-2.5 text-[10px] font-mono text-text-3 border border-transparent rounded-md hover:border-red-lp/20 hover:text-red-lp/70 transition-all duration-150"
          >
            Deletar
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3 flex-1">
        <h3 className="font-syne font-bold text-[14px] text-text-1 leading-snug mb-1 line-clamp-2">
          {projeto.nome}
        </h3>
        <p className="font-mono text-[11px] text-text-3 flex items-center gap-1.5">
          <span className="opacity-50">◈</span>
          {clienteNome}
        </p>
      </div>

      {/* Tags */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {[projeto.niche, projeto.sub_niche, projeto.page_type].map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-md font-mono text-[9px] tracking-wide text-text-3"
            style={{ background: 'rgba(26,35,50,0.8)', border: '1px solid rgba(30,43,60,0.8)' }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(30,43,60,0.5)' }}
      >
        <span className="font-mono text-[10px] text-text-3 opacity-60">
          {formatDate(projeto.created_at)}
        </span>
        <span className="font-mono text-[9px] text-text-3 opacity-40 uppercase tracking-widest">
          LP
        </span>
      </div>
    </div>
  )
}
