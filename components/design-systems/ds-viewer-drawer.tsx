'use client'

import { Drawer } from '@/components/shared/drawer'
import type { DesignSystem } from '@/lib/types'

type DsViewerDrawerProps = {
  open: boolean
  ds: DesignSystem | null
  onClose: () => void
}

export function DsViewerDrawer({ open, ds, onClose }: DsViewerDrawerProps) {
  function downloadHtml() {
    if (!ds?.ds_html) return
    const blob = new Blob([ds.ds_html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ds.nome.replace(/\s+/g, '-').toLowerCase()}-design-system.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadBundle() {
    if (!ds) return
    const res = await fetch(`/api/design-systems/${ds.id}/bundle`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ds.nome.replace(/\s+/g, '-').toLowerCase()}-bundle.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isProcessing = !ds || ds.status === 'processing' || (ds.status === 'pending')

  return (
    <Drawer open={open} onClose={onClose} width="480px">
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-5"
        style={{ borderBottom: '1px solid #1E2B3C' }}
      >
        <div>
          <h2 className="font-syne font-bold text-[16px] text-text-1 line-clamp-1">
            {ds?.nome ?? 'Design System'}
          </h2>
          <p className="font-mono text-[10px] text-text-3 mt-0.5 uppercase tracking-[1.5px]">
            Preview do design system
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar drawer"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-default text-text-3 hover:border-border-hi hover:text-text-1 transition-all text-[13px]"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden relative">
        {isProcessing || !ds?.ds_html ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
            {/* Skeleton */}
            <div className="w-full space-y-3">
              <div className="h-6 rounded-md animate-pulse" style={{ background: '#1E2B3C' }} />
              <div className="h-4 rounded-md w-3/4 animate-pulse" style={{ background: '#1E2B3C' }} />
              <div className="h-32 rounded-lg animate-pulse" style={{ background: '#1E2B3C' }} />
              <div className="h-4 rounded-md w-1/2 animate-pulse" style={{ background: '#1E2B3C' }} />
              <div className="h-16 rounded-md animate-pulse" style={{ background: '#1E2B3C' }} />
            </div>
            <p className="font-mono text-[11px] text-text-3 uppercase tracking-[1.5px] mt-2">
              <span className="inline-block w-2 h-2 rounded-full mr-2 align-middle animate-pulse" style={{ backgroundColor: '#F0B429' }} />
              Extraindo design system...
            </p>
          </div>
        ) : (
          <iframe
            srcDoc={ds.ds_html}
            title={`Design System — ${ds.nome}`}
            className="w-full h-full border-0"
          />
        )}
      </div>

      {/* Footer */}
      <div
        className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4"
        style={{ borderTop: '1px solid #1E2B3C' }}
      >
        <button
          type="button"
          onClick={downloadHtml}
          disabled={!ds?.ds_html}
          className="h-10 px-4 text-[12px] font-medium text-text-2 border border-border-default rounded-lg hover:border-border-hi hover:text-text-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed font-mono"
        >
          Download .html
        </button>
        <button
          type="button"
          onClick={downloadBundle}
          disabled={!ds?.storage_path || !ds?.ds_html}
          className="h-10 px-4 bg-accent text-bg-base font-syne font-bold text-[12px] tracking-tight rounded-lg hover:brightness-110 hover:shadow-accent-glow transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Download Bundle .zip
        </button>
      </div>
    </Drawer>
  )
}
