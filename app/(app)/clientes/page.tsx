import { createClient } from '@/lib/supabase/server'
import { ClientesClientWrapper } from './client-wrapper'
import type { Cliente } from '@/lib/types'

type ClienteWithCount = Cliente & { projeto_count: number }

export default async function ClientesPage() {
  const supabase = await createClient()

  const [{ data: clientes }, { data: projCounts }] = await Promise.all([
    supabase.from('clientes').select('*').order('created_at', { ascending: false }),
    supabase.from('projetos').select('cliente_id'),
  ])

  const countMap = (projCounts ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.cliente_id] = (acc[p.cliente_id] ?? 0) + 1
    return acc
  }, {})

  const clientesWithCount: ClienteWithCount[] = (clientes ?? []).map(c => ({
    ...c,
    projeto_count: countMap[c.id] ?? 0,
  }))

  return <ClientesClientWrapper clientes={clientesWithCount} />
}
