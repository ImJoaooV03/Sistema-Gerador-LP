'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DsCard } from '@/components/design-systems/ds-card'
import { DsUploadModal } from '@/components/design-systems/ds-upload-modal'
import { DsViewerDrawer } from '@/components/design-systems/ds-viewer-drawer'
import { TopbarPortal } from '@/components/shared/topbar-portal'
import type { DesignSystem } from '@/lib/types'

type Props = { designSystems: DesignSystem[] }

export function DesignSystemsClientWrapper({ designSystems: initial }: Props) {
  const [list, setList]           = useState<DesignSystem[]>(initial)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewing, setViewing]     = useState<DesignSystem | null>(null)
  const router = useRouter()

  function handleUploaded(id: string, dsHtml: string) {
    setModalOpen(false)
    router.refresh()
  }

  function handleCardClick(id: string) {
    const ds = list.find(d => d.id === id) ?? null
    setViewing(ds)
  }

  if (list.length === 0) {
    return (
      <>
        <TopbarPortal>
          <button
            onClick={() => setModalOpen(true)}
            className="h-8 px-4 bg-accent text-bg-base font-syne font-bold text-[12px] tracking-tight rounded-lg hover:brightness-110 transition-all"
          >
            + Novo Design System
          </button>
        </TopbarPortal>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div
            className="w-12 h-12 rounded-xl border border-border-default flex items-center justify-center text-[20px] text-text-3"
            style={{ background: 'rgba(240,180,41,0.05)' }}
          >
            ◉
          </div>
          <div className="text-center">
            <p className="font-syne font-bold text-[15px] text-text-2 mb-1">Nenhum design system</p>
            <p className="text-[12px] font-mono text-text-3">Faça upload de um ZIP para começar</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="h-9 px-5 bg-accent text-bg-base font-syne font-bold text-[12px] tracking-tight rounded-lg hover:brightness-110 transition-all"
          >
            + Adicionar Design System
          </button>
        </div>
        <DsUploadModal open={modalOpen} onClose={() => setModalOpen(false)} onUpload={handleUploaded} />
      </>
    )
  }

  return (
    <>
      <TopbarPortal>
        <button
          onClick={() => setModalOpen(true)}
          className="h-8 px-4 bg-accent text-bg-base font-syne font-bold text-[12px] tracking-tight rounded-lg hover:brightness-110 transition-all"
        >
          + Novo Design System
        </button>
      </TopbarPortal>

      <div className="grid grid-cols-3 gap-4">
        {list.map(ds => (
          <DsCard key={ds.id} ds={ds} onClick={handleCardClick} />
        ))}
      </div>

      <DsUploadModal open={modalOpen} onClose={() => setModalOpen(false)} onUpload={handleUploaded} />
      <DsViewerDrawer open={!!viewing} ds={viewing} onClose={() => setViewing(null)} />
    </>
  )
}
