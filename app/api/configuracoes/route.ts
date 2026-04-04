import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ConfiguracoesPublic } from '@/lib/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('configuracoes')
    .select('anthropic_key, openai_key, modelo_ds, modelo_lp, prompt_ds, prompt_lp')
    .eq('id', 1)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const response: ConfiguracoesPublic = {
    anthropic_key_set: !!data?.anthropic_key,
    openai_key_set:    !!data?.openai_key,
    modelo_ds:         data?.modelo_ds ?? 'claude-sonnet-4-6',
    modelo_lp:         data?.modelo_lp ?? 'claude-opus-4-6',
    prompt_ds:         data?.prompt_ds ?? null,
    prompt_lp:         data?.prompt_lp ?? null,
  }

  return NextResponse.json(response)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const body = await req.json() as Partial<{
      anthropic_key: string
      openai_key: string
      modelo_ds: string
      modelo_lp: string
      prompt_ds: string
      prompt_lp: string
    }>

    // Filtra campos vazios para não sobrescrever keys existentes com string vazia
    const updates: Record<string, string> = {}
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === 'string' && v.trim() !== '') {
        updates[k] = v.trim()
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true })
    }

    updates.updated_at = new Date().toISOString()

    const admin = createAdminClient()
    const { error } = await admin
      .from('configuracoes')
      .update(updates)
      .eq('id', 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
