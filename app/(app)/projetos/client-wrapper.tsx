'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProjetosGrid } from '@/components/projetos/projetos-grid'
import { ProjetoDrawer } from '@/components/projetos/projeto-drawer'
import { AlertConfirm } from '@/components/shared/alert-confirm'
import { TopbarPortal } from '@/components/shared/topbar-portal'
import type { Cliente, Projeto } from '@/lib/types'

type ProjetoWithCliente = Projeto & { cliente_nome: string }

type Props = {
  projetos: ProjetoWithCliente[]
  clientes: Cliente[]
}

export function ProjetosClientWrapper({ projetos, clientes }: Props) {
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [editing, setEditing]               = useState<Projeto | null>(null)
  const [deleting, setDeleting]             = useState<Projeto | null>(null)
  const [deleteLoading, setDeleteLoading]   = useState(false)
  const router = useRouter()

  function handleEdit(projeto: Projeto) {
    setEditing(projeto)
    setDrawerOpen(true)
  }

  function handleDrawerClose() {
    setDrawerOpen(false)
    setEditing(null)
  }

  async function handleDeleteConfirm() {
    if (!deleting) return
    setDeleteLoading(true)
    const supabase = createClient()
    await supabase.from('projetos').delete().eq('id', deleting.id)
    router.refresh()
    setDeleting(null)
    setDeleteLoading(false)
  }

  return (
    <>
      <TopbarPortal>
        <button
          onClick={() => setDrawerOpen(true)}
          className="h-8 px-4 bg-accent text-bg-base font-syne font-bold text-[12px] tracking-tight rounded-lg hover:brightness-110 transition-all"
        >
          + Novo Projeto
        </button>
      </TopbarPortal>

      <ProjetosGrid
        projetos={projetos}
        onEdit={handleEdit}
        onDelete={setDeleting}
        onNew={() => setDrawerOpen(true)}
      />

      <ProjetoDrawer
        open={drawerOpen}
        projeto={editing}
        clientes={clientes}
        onClose={handleDrawerClose}
      />

      <AlertConfirm
        open={!!deleting}
        title="Deletar projeto?"
        description={`Isso deletará "${deleting?.nome}" e a LP gerada vinculada, se houver. Esta ação não pode ser desfeita.`}
        confirmLabel="Deletar"
        destructive
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}
