import { createClient } from '@/lib/supabase/server'
import { ProjetosClientWrapper } from './client-wrapper'
import type { Cliente, Projeto } from '@/lib/types'

type ProjetoWithCliente = Projeto & { cliente_nome: string }

export default async function ProjetosPage() {
  const supabase = await createClient()

  const [{ data: projetos }, { data: clientes }] = await Promise.all([
    supabase.from('projetos').select('*').order('created_at', { ascending: false }),
    supabase.from('clientes').select('*').order('nome'),
  ])

  const clienteMap = Object.fromEntries(
    (clientes ?? []).map(c => [c.id, c.nome])
  )

  const projetosWithCliente: ProjetoWithCliente[] = (projetos ?? []).map(p => ({
    ...p,
    cliente_nome: clienteMap[p.cliente_id] ?? '—',
  }))

  return (
    <ProjetosClientWrapper
      projetos={projetosWithCliente}
      clientes={clientes ?? []}
    />
  )
}
