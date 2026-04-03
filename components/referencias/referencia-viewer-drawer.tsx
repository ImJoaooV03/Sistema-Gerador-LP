'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Drawer } from '@/components/shared/drawer'
import { AlertConfirm } from '@/components/shared/alert-confirm'
import { createClient } from '@/lib/supabase/client'
import type { Referencia } from '@/lib/types'

type ReferenciaViewerDrawerProps = {
  open: boolean
  referencia: Referencia | null
  onClose: () => void
}

type Tab = 'lp' | 'ds'

export function ReferenciaViewerDrawer({ open, referencia, onClose }: ReferenciaViewerDrawerProps) {
  const [activeTab,      setActiveTab]      = useState<Tab>('lp')
  const [deleteOpen,     setDeleteOpen]     = useState(false)
  const [deleting,       setDeleting]       = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!referencia) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('referencias').delete().eq('id', referencia.id)
    setDeleting(false)
    setDeleteOpen(false)
    router.refresh()
    onClose()
  }

  const lpSrc = referencia ? `/api/serve/referencias/${referencia.id}/index.html` : undefined
  const dsSrc = referencia ? `/api/serve/referencias/${referencia.id}/design-system.html` : undefined

  return (
    <>
      <Drawer open={open} onClose={onClose} width="640px">
        {/* Header */}
        <div
          className="flex-shrink-0 flex items-start justify-between px-6 py-5"
          style={{ borderBottom: '1px solid #1E2B3C' }}
        >
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="font-syne font-bold text-[16px] text-text-1 line-clamp-1">
              {referencia?.nome ?? 'Referência'}
            </h2>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {referencia && (
                <>
                  <span
                    className="px-2 py-0.5 rounded-full font-mono text-[9px] tracking-wide"
                    style={{ background: 'rgba(240,180,41,0.12)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.2)' }}
                  >
                    {referencia.niche}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full font-mono text-[9px] tracking-wide text-text-3"
                    style={{ background: 'rgba(30,43,60,0.8)', border: '1px solid rgba(30,43,60,0.6)' }}
                  >
                    {referencia.sub_niche}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full font-mono text-[9px] tracking-wide text-text-3"
                    style={{ background: 'rgba(30,43,60,0.8)', border: '1px solid rgba(30,43,60,0.6)' }}
                  >
                    {referencia.page_type}
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar drawer"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-border-default text-text-3 hover:border-border-hi hover:text-text-1 transition-all text-[13px]"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex-shrink-0 flex items-center gap-1 px-6 pt-4 pb-0"
          style={{ borderBottom: '1px solid #1E2B3C' }}
        >
          {(['lp', 'ds'] as Tab[]).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="px-4 pb-3 font-mono text-[11px] uppercase tracking-[1.5px] transition-all relative"
              style={{ color: activeTab === tab ? '#F0B429' : '#8896A8' }}
            >
              {tab === 'lp' ? 'LP Completa' : 'Design System'}
              {activeTab === tab && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: '#F0B429' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'lp' && lpSrc && (
            <iframe
              key={lpSrc}
              src={lpSrc}
              title="LP Completa"
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full border-0"
            />
          )}
          {activeTab === 'ds' && dsSrc && (
            <iframe
              key={dsSrc}
              src={dsSrc}
              title="Design System"
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full border-0"
            />
          )}
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 flex items-center justify-end px-6 py-4"
          style={{ borderTop: '1px solid #1E2B3C' }}
        >
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="h-9 px-4 text-[12px] font-mono text-red-lp/70 border border-red-lp/20 rounded-lg hover:bg-red-lp/5 hover:border-red-lp/40 hover:text-red-lp transition-all"
          >
            Deletar
          </button>
        </div>
      </Drawer>

      <AlertConfirm
        open={deleteOpen}
        title="Deletar referência?"
        description={`"${referencia?.nome}" será removida permanentemente da biblioteca.`}
        confirmLabel={deleting ? 'Deletando...' : 'Deletar'}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  )
}
