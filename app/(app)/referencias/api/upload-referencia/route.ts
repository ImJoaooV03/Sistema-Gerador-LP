import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const formData = await req.formData()
    const file       = formData.get('file') as File | null
    const nome       = (formData.get('nome') as string | null)?.trim()
    const niche      = (formData.get('niche') as string | null)?.trim()
    const sub_niche  = (formData.get('sub_niche') as string | null)?.trim()
    const page_type  = (formData.get('page_type') as string | null)?.trim()
    const observacoes = (formData.get('observacoes') as string | null)?.trim() || null

    if (!file)      return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })
    if (!nome)      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
    if (!niche)     return NextResponse.json({ error: 'Niche obrigatório' }, { status: 400 })
    if (!sub_niche) return NextResponse.json({ error: 'Sub-niche obrigatório' }, { status: 400 })
    if (!page_type) return NextResponse.json({ error: 'Page type obrigatório' }, { status: 400 })

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande (máx 50MB)' }, { status: 400 })
    }

    // Validate ZIP has index.html
    const buffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(buffer)
    if (!zip.file('index.html')) {
      return NextResponse.json({ error: 'ZIP deve conter index.html na raiz' }, { status: 400 })
    }

    // Insert metadata first to get ID
    const { data: ref, error: insertErr } = await supabase
      .from('referencias')
      .insert({
        nome,
        niche,
        sub_niche,
        page_type,
        observacoes,
        storage_path: '',
        tags: [],
      })
      .select('id')
      .single()

    if (insertErr || !ref) {
      return NextResponse.json({ error: insertErr?.message ?? 'DB error' }, { status: 500 })
    }

    // Upload ZIP
    const { error: storageErr } = await supabase.storage
      .from('referencias')
      .upload(`${ref.id}.zip`, file, { contentType: 'application/zip', upsert: true })

    if (storageErr) {
      await supabase.from('referencias').delete().eq('id', ref.id)
      return NextResponse.json({ error: `Storage: ${storageErr.message}` }, { status: 500 })
    }

    // Update storage_path
    await supabase.from('referencias').update({ storage_path: `${ref.id}.zip` }).eq('id', ref.id)

    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
