import { createAdminClient } from '@/lib/supabase/admin'
import { ConfiguracoesClientWrapper } from './client-wrapper'
import { DEFAULT_MODELO_DS, DEFAULT_MODELO_LP } from '@/lib/defaults'
import type { ConfiguracoesPublic } from '@/lib/types'

export default async function ConfiguracoesPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('configuracoes')
    .select('anthropic_key, openai_key, modelo_ds, modelo_lp, prompt_ds, prompt_lp')
    .eq('id', 1)
    .single()

  const config: ConfiguracoesPublic = {
    anthropic_key_set: !!data?.anthropic_key,
    openai_key_set:    !!data?.openai_key,
    modelo_ds:         data?.modelo_ds ?? DEFAULT_MODELO_DS,
    modelo_lp:         data?.modelo_lp ?? DEFAULT_MODELO_LP,
    prompt_ds:         data?.prompt_ds ?? null,
    prompt_lp:         data?.prompt_lp ?? null,
  }

  return <ConfiguracoesClientWrapper config={config} />
}
