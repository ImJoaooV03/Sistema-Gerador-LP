import { createAdminClient } from '@/lib/supabase/admin'
import type { Configuracoes } from '@/lib/types'
import { DEFAULT_MODELO_DS, DEFAULT_MODELO_LP } from '@/lib/defaults'

export async function getConfiguracoes(): Promise<Configuracoes> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('configuracoes')
    .select('*')
    .eq('id', 1)
    .single()

  return data ?? {
    id: 1,
    anthropic_key: null,
    openai_key: null,
    modelo_ds: DEFAULT_MODELO_DS,
    modelo_lp: DEFAULT_MODELO_LP,
    prompt_ds: null,
    prompt_lp: null,
    updated_at: new Date().toISOString(),
  }
}
