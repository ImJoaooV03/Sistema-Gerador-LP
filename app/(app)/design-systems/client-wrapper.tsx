'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DsCard } from '@/components/design-systems/ds-card'
import { DsUploadModal } from '@/components/design-systems/ds-upload-modal'
import { DsViewerDrawer } from '@/components/design-systems/ds-viewer-drawer'
import { AlertConfirm } from '@/components/shared/alert-confirm'
import { TopbarPortal } from '@/components/shared/topbar-portal'
import type { DesignSystem } from '@/lib/types'

type Props = { designSystems: DesignSystem[] }

export function DesignSystemsClientWrapper({ designSystems: initial }: Props) {
  const [list,          setList]          = useState<DesignSystem[]>(initial)
  const [modalOpen,     setModalOpen]     = useState(false)

  // Sync when server re-fetches (router.refresh())
  useEffect(() => { setList(initial) }, [initial])
  const [viewing,       setViewing]       = useState<DesignSystem | null>(null)
  const [deleting,      setDeleting]      = useState<DesignSystem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const router = useRouter()

  function handleUploaded(_id: string, _dsHtml: string) {
    setModalOpen(false)
    router.refresh()
  }

  function handleCardClick(id: string) {
    const ds = list.find(d => d.id === id) ?? null
    setViewing(ds)
  }

  function handleDeleteRequest(id: string) {
    const ds = list.find(d => d.id === id) ?? null
    setDeleting(ds)
  }

  async function handleDeleteConfirm() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/design-systems/api/${deleting.id}`, { method: 'DELETE' })
      if (res.ok) {
        setList(prev => prev.filter(d => d.id !== deleting.id))
      }
    } finally {
      setDeleteLoading(false)
      setDeleting(null)
    }
  }

  const newButton = (
    <button
      onClick={() => setModalOpen(true)}
      className="h-8 px-4 bg-accent text-bg-base font-syne font-bold text-[12px] tracking-tight rounded-lg hover:brightness-110 transition-all"
    >
      + Novo Design System
    </button>
  )

  if (list.length === 0) {
    return (
      <>
        <TopbarPortal>{newButton}</TopbarPortal>
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
      <TopbarPortal>{newButton}</TopbarPortal>

      <div className="grid grid-cols-3 gap-4">
        {list.map(ds => (
          <DsCard
            key={ds.id}
            ds={ds}
            onClick={handleCardClick}
            onDelete={handleDeleteRequest}
          />
        ))}
      </div>

      <DsUploadModal open={modalOpen} onClose={() => setModalOpen(false)} onUpload={handleUploaded} />
      <DsViewerDrawer open={!!viewing} ds={viewing} onClose={() => setViewing(null)} />

      <AlertConfirm
        open={!!deleting}
        title="Excluir design system?"
        description={`"${deleting?.nome}" será removido permanentemente, incluindo o arquivo ZIP. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}
