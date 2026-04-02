'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ClientesTable } from '@/components/clientes/clientes-table'
import { ClienteModal } from '@/components/clientes/cliente-modal'
import { AlertConfirm } from '@/components/shared/alert-confirm'
import { TopbarPortal } from '@/components/shared/topbar-portal'
import type { Cliente } from '@/lib/types'

type ClienteWithCount = Cliente & { projeto_count: number }

type Props = { clientes: ClienteWithCount[] }

export function ClientesClientWrapper({ clientes }: Props) {
  const [modalOpen, setModalOpen]           = useState(false)
  const [editing, setEditing]               = useState<Cliente | null>(null)
  const [deleting, setDeleting]             = useState<Cliente | null>(null)
  const [deleteLoading, setDeleteLoading]   = useState(false)
  const router = useRouter()

  function handleEdit(cliente: Cliente) {
    setEditing(cliente)
    setModalOpen(true)
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditing(null)
  }

  async function handleDeleteConfirm() {
    if (!deleting) return
    setDeleteLoading(true)
    const supabase = createClient()
    await supabase.from('clientes').delete().eq('id', deleting.id)
    router.refresh()
    setDeleting(null)
    setDeleteLoading(false)
  }

  return (
    <>
      <TopbarPortal>
        <button
          onClick={() => setModalOpen(true)}
          className="h-8 px-4 bg-accent text-bg-base font-syne font-bold text-[12px] tracking-tight rounded-lg hover:brightness-110 transition-all"
        >
          + Novo Cliente
        </button>
      </TopbarPortal>

      <ClientesTable
        clientes={clientes}
        onEdit={handleEdit}
        onDelete={setDeleting}
      />

      <ClienteModal
        open={modalOpen}
        cliente={editing}
        onClose={handleModalClose}
      />

      <AlertConfirm
        open={!!deleting}
        title="Deletar cliente?"
        description={`Isso também deletará todos os projetos vinculados a "${deleting?.nome}". Esta ação não pode ser desfeita.`}
        confirmLabel="Deletar"
        destructive
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}
