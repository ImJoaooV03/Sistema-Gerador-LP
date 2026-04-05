import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  let body: { nome?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const nome = (body.nome ?? '').trim()
  if (!nome) return NextResponse.json({ error: 'nome é obrigatório' }, { status: 400 })

  // Insert record
  const { data: ds, error: insertErr } = await supabase
    .from('design_systems')
    .insert({ nome, storage_path: '', status: 'pending' })
    .select('id')
    .single()

  if (insertErr || !ds) {
    return NextResponse.json({ error: insertErr?.message ?? 'DB error' }, { status: 500 })
  }

  const path = `${ds.id}.zip`

  // Create signed upload URL (admin client bypasses RLS)
  const admin = createAdminClient()
  const { data: signed, error: signErr } = await admin.storage
    .from('design-systems')
    .createSignedUploadUrl(path)

  if (signErr || !signed) {
    await supabase
      .from('design_systems')
      .update({ status: 'error', error_msg: signErr?.message ?? 'Storage error' })
      .eq('id', ds.id)
    return NextResponse.json({ error: signErr?.message ?? 'Storage error' }, { status: 500 })
  }

  // Save path on record
  await supabase.from('design_systems').update({ storage_path: path }).eq('id', ds.id)

  return NextResponse.json({ id: ds.id, uploadUrl: signed.signedUrl, path })
}
