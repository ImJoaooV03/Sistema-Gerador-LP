'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { NicheFilterBar } from '@/components/referencias/niche-filter-bar'
import { ReferenciaCard } from '@/components/referencias/referencia-card'
import { ReferenciaUploadDrawer } from '@/components/referencias/referencia-upload-drawer'
import { ReferenciaViewerDrawer } from '@/components/referencias/referencia-viewer-drawer'
import { TopbarPortal } from '@/components/shared/topbar-portal'
import type { Referencia } from '@/lib/types'

type Props = { referencias: Referencia[] }

export function ReferenciasClientWrapper({ referencias: initial }: Props) {
  const [list, setList]               = useState<Referencia[]>(initial)
  const [activeNiche, setActiveNiche] = useState('todos')
  const [uploadOpen, setUploadOpen]   = useState(false)
  const [viewing, setViewing]         = useState<Referencia | null>(null)
  const router = useRouter()

  const filtered = useMemo(() =>
    activeNiche === 'todos' ? list : list.filter(r => r.niche === activeNiche),
    [list, activeNiche]
  )

  function handleUploaded(ref: Referencia) {
    setList(prev => [ref, ...prev])
    setUploadOpen(false)
  }

  if (list.length === 0) {
    return (
      <>
        <TopbarPortal>
          <button
            onClick={() => setUploadOpen(true)}
            className="h-8 px-4 bg-accent text-bg-base font-syne font-bold text-[12px] tracking-tight rounded-lg hover:brightness-110 transition-all"
          >
            + Nova Referência
          </button>
        </TopbarPortal>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div
            className="w-12 h-12 rounded-xl border border-border-default flex items-center justify-center text-[20px] text-text-3"
            style={{ background: 'rgba(240,180,41,0.05)' }}
          >
            ◈
          </div>
          <div className="text-center">
            <p className="font-syne font-bold text-[15px] text-text-2 mb-1">Nenhuma referência</p>
            <p className="text-[12px] font-mono text-text-3">Faça upload de um ZIP para começar</p>
          </div>
          <button
            onClick={() => setUploadOpen(true)}
            className="h-9 px-5 bg-accent text-bg-base font-syne font-bold text-[12px] tracking-tight rounded-lg hover:brightness-110 transition-all"
          >
            + Adicionar Referência
          </button>
        </div>
        <ReferenciaUploadDrawer open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={handleUploaded} />
      </>
    )
  }

  return (
    <>
      <TopbarPortal>
        <button
          onClick={() => setUploadOpen(true)}
          className="h-8 px-4 bg-accent text-bg-base font-syne font-bold text-[12px] tracking-tight rounded-lg hover:brightness-110 transition-all"
        >
          + Nova Referência
        </button>
      </TopbarPortal>

      <div className="mb-5">
        <NicheFilterBar active={activeNiche} onChange={setActiveNiche} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="font-syne font-bold text-[14px] text-text-2">
            Nenhuma referência em &quot;{activeNiche}&quot;
          </p>
          <button
            onClick={() => setActiveNiche('todos')}
            className="text-[12px] font-mono text-accent hover:underline"
          >
            Ver todas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(ref => (
            <ReferenciaCard key={ref.id} referencia={ref} onClick={setViewing} />
          ))}
        </div>
      )}

      <ReferenciaUploadDrawer open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={handleUploaded} />
      <ReferenciaViewerDrawer
        open={!!viewing}
        referencia={viewing}
        onClose={() => { setViewing(null); router.refresh() }}
      />
    </>
  )
}
