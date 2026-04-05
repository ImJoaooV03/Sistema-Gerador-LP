'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { DesignSystem, DsStatus } from '@/lib/types'

type DsCardProps = {
  ds: DesignSystem
  onClick: (id: string) => void
  onDelete: (id: string) => void
}

const STATUS_CONFIG: Record<DsStatus, {
  label: string
  color: string
  bg: string
  border: string
  pulse?: boolean
}> = {
  pending: {
    label: 'Aguardando',
    color: '#4A5568',
    bg: 'rgba(74,85,104,0.12)',
    border: 'rgba(74,85,104,0.2)',
  },
  processing: {
    label: 'Extraindo',
    color: '#F0B429',
    bg: 'rgba(240,180,41,0.10)',
    border: 'rgba(240,180,41,0.25)',
    pulse: true,
  },
  done: {
    label: 'Concluído',
    color: '#00D4AA',
    bg: 'rgba(0,212,170,0.10)',
    border: 'rgba(0,212,170,0.22)',
  },
  error: {
    label: 'Erro',
    color: '#FF4757',
    bg: 'rgba(255,71,87,0.10)',
    border: 'rgba(255,71,87,0.22)',
  },
}

const PALETTES = [
  { primary: '#F0B429', mid: '#D97706', dark: '#92400E', glow: 'rgba(240,180,41,0.18)' },
  { primary: '#00D4AA', mid: '#0891B2', dark: '#155E75', glow: 'rgba(0,212,170,0.18)' },
  { primary: '#A78BFA', mid: '#7C3AED', dark: '#4C1D95', glow: 'rgba(167,139,250,0.18)' },
  { primary: '#60A5FA', mid: '#2563EB', dark: '#1E3A8A', glow: 'rgba(96,165,250,0.18)' },
  { primary: '#F472B6', mid: '#DB2777', dark: '#831843', glow: 'rgba(244,114,182,0.18)' },
]

function getPalette(name: string) {
  const seed = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return PALETTES[seed % PALETTES.length]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const SECTIONS = ['Typography', 'Colors', 'Components', 'Layout', 'Motion']

export function DsCard({ ds, onClick, onDelete }: DsCardProps) {
  const [hovered, setHovered] = useState(false)
  const status = STATUS_CONFIG[ds.status]
  const pal = getPalette(ds.nome)
  const isDone = ds.status === 'done'

  return (
    <div
      className="relative flex flex-col rounded-2xl cursor-pointer overflow-hidden select-none"
      style={{
        background: '#0C1018',
        border: `1px solid ${hovered ? pal.primary + '40' : '#1E2B3C'}`,
        boxShadow: hovered
          ? `0 24px 56px rgba(0,0,0,0.45), 0 0 0 1px ${pal.primary}18, inset 0 1px 0 rgba(255,255,255,0.04)`
          : '0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.02)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 250ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 250ms ease, border-color 250ms ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(ds.id)}
    >
      {/* ── PREVIEW AREA ───────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: 128 }}>

        {/* Base gradient bg */}
        <div className="absolute inset-0" style={{
          background: `linear-gradient(145deg, #0A0F18 0%, #111827 60%, #0C1018 100%)`,
        }} />

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }} />

        {/* Radial glow */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at 25% 60%, ${pal.glow} 0%, transparent 65%)`,
            opacity: hovered ? 1 : 0.5,
          }}
        />

        {/* ── Abstract DS preview content ── */}
        <div className="absolute inset-0 flex items-center px-5 gap-4">

          {/* Typography bars */}
          <div className="flex flex-col gap-[7px]" style={{ width: 72 }}>
            {[
              { w: '100%', h: 7, accent: true },
              { w: '75%',  h: 4, accent: false },
              { w: '88%',  h: 3, accent: false },
              { w: '55%',  h: 3, accent: false },
            ].map((bar, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-500"
                style={{
                  width: bar.w,
                  height: bar.h,
                  background: bar.accent
                    ? `linear-gradient(90deg, ${pal.primary}, ${pal.mid})`
                    : `rgba(255,255,255,${0.13 - i * 0.025})`,
                  transitionDelay: `${i * 20}ms`,
                  transform: hovered && bar.accent ? 'scaleX(1.03)' : 'scaleX(1)',
                  transformOrigin: 'left',
                }}
              />
            ))}
          </div>

          {/* Color swatches */}
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1.5">
              {[pal.primary, pal.mid, pal.dark, '#263648'].map((c, i) => (
                <div
                  key={i}
                  className="rounded-[5px] transition-all duration-300"
                  style={{
                    width: 18, height: 18,
                    background: c,
                    transform: hovered ? `translateY(${-i * 1.5}px) scale(1.08)` : 'none',
                    transitionDelay: `${i * 25}ms`,
                    boxShadow: hovered && i === 0 ? `0 4px 12px ${pal.primary}50` : 'none',
                  }}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              {['#EDF2F7', '#8896A8', '#4A5568', '#1E2B3C'].map((c, i) => (
                <div key={i} className="rounded-[5px]" style={{ width: 18, height: 18, background: c }} />
              ))}
            </div>
          </div>

          {/* Component sketches */}
          <div className="flex flex-col gap-2 ml-auto">
            {/* Primary button sketch */}
            <div
              className="rounded-[6px] flex items-center justify-center transition-all duration-300"
              style={{
                width: 68, height: 23,
                background: hovered ? pal.primary : 'transparent',
                border: `1.5px solid ${hovered ? pal.primary : pal.primary + '55'}`,
                boxShadow: hovered ? `0 0 12px ${pal.primary}40` : 'none',
              }}
            >
              <div className="rounded-full" style={{
                width: 30, height: 2.5,
                background: hovered ? '#07090F' : pal.primary + '70',
              }} />
            </div>
            {/* Card sketch */}
            <div
              className="rounded-[6px] p-2 flex flex-col gap-[5px]"
              style={{
                width: 68,
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.025)',
              }}
            >
              <div className="rounded-full" style={{ width: '70%', height: 2.5, background: 'rgba(255,255,255,0.18)' }} />
              <div className="rounded-full" style={{ width: '90%', height: 2, background: 'rgba(255,255,255,0.09)' }} />
              <div className="rounded-full" style={{ width: '55%', height: 2, background: 'rgba(255,255,255,0.06)' }} />
            </div>
          </div>
        </div>

        {/* Processing overlay */}
        {ds.status === 'processing' && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: 'rgba(7,9,15,0.72)', backdropFilter: 'blur(2px)' }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: '#F0B429', animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[2.5px] text-accent opacity-80">
              Extraindo...
            </span>
          </div>
        )}

        {/* Error overlay */}
        {ds.status === 'error' && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(7,9,15,0.75)', backdropFilter: 'blur(2px)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.3)' }}>
                <span style={{ color: '#FF4757', fontSize: 8, lineHeight: 1 }}>✕</span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[2px]" style={{ color: '#FF4757' }}>
                Falha na extração
              </span>
            </div>
          </div>
        )}

        {/* Bottom fade into body */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ height: 32, background: 'linear-gradient(to bottom, transparent, #0C1018)' }}
        />

        {/* Top shimmer line */}
        <div
          className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${pal.primary}50 40%, ${pal.primary}80 50%, ${pal.primary}50 60%, transparent 100%)`,
            opacity: hovered ? 1 : 0,
          }}
        />
      </div>

      {/* ── BODY ───────────────────────────────────────────── */}
      <div className="flex flex-col px-4 pt-3 pb-4 gap-3">

        {/* Status + delete */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-full"
            style={{
              background: status.bg,
              border: `1px solid ${status.border}`,
            }}
          >
            <span
              className={cn('w-[5px] h-[5px] rounded-full flex-shrink-0', status.pulse && 'animate-pulse')}
              style={{ backgroundColor: status.color }}
            />
            <span className="font-mono text-[8.5px] uppercase tracking-[1.5px]" style={{ color: status.color }}>
              {status.label}
            </span>
          </div>

          <button
            aria-label="Excluir design system"
            onClick={e => { e.stopPropagation(); onDelete(ds.id) }}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150',
              'text-text-3 hover:text-red-lp hover:bg-red-lp/10 hover:border-red-lp/20',
              hovered ? 'opacity-100 border-border-default' : 'opacity-0 border-transparent'
            )}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 3h8M5 3V2h2v1M4.5 3v6.5h3V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Name */}
        <div>
          <h3 className="font-syne font-bold text-[15px] leading-snug line-clamp-2" style={{ color: '#EDF2F7' }}>
            {ds.nome}
          </h3>
          {ds.status === 'error' && ds.error_msg && (
            <p className="mt-1 font-mono text-[10px] line-clamp-1" style={{ color: 'rgba(255,71,87,0.65)' }}>
              {ds.error_msg}
            </p>
          )}
        </div>

        {/* Section tags */}
        {isDone && (
          <div className="flex flex-wrap gap-1">
            {SECTIONS.map(s => (
              <span
                key={s}
                className="font-mono text-[7.5px] uppercase tracking-[1px] px-2 py-[3px] rounded-full"
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-2.5"
          style={{ borderTop: '1px solid rgba(30,43,60,0.7)' }}
        >
          <span className="font-mono text-[9.5px]" style={{ color: 'rgba(74,85,104,0.8)' }}>
            {formatDate(ds.created_at)}
          </span>
          <span
            className="font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all duration-300"
            style={{
              color: pal.primary,
              opacity: hovered ? 1 : 0.3,
              transform: hovered ? 'translateX(3px)' : 'translateX(0)',
            }}
          >
            Ver DS →
          </span>
        </div>
      </div>
    </div>
  )
}
