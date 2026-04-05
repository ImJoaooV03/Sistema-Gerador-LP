import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import JSZip from 'jszip'

export const maxDuration = 60

/** Pure helper — injects design-system.html into an existing JSZip and returns the combined ZIP bytes */
export async function injectDsHtml(zip: JSZip, dsHtml: string): Promise<Uint8Array> {
  zip.file('design-system.html', dsHtml)
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Fetch DS record
  const { data: ds, error } = await supabase
    .from('design_systems')
    .select('id, nome, storage_path, ds_html, status')
    .eq('id', id)
    .single()

  if (error || !ds) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!ds.ds_html) return NextResponse.json({ error: 'Design system not ready' }, { status: 400 })
  if (!ds.storage_path) return NextResponse.json({ error: 'Original ZIP not found' }, { status: 400 })

  // Download original ZIP from Storage
  const admin = createAdminClient()
  const { data: zipData, error: storageErr } = await admin.storage
    .from('design-systems')
    .download(ds.storage_path)

  if (storageErr || !zipData) {
    return NextResponse.json({ error: 'Failed to download original ZIP' }, { status: 500 })
  }

  // Load ZIP, inject design-system.html, return combined ZIP
  const buffer = await zipData.arrayBuffer()
  const zip = await JSZip.loadAsync(buffer)
  const combined = await injectDsHtml(zip, ds.ds_html)

  const slug = ds.nome.replace(/\s+/g, '-').toLowerCase()
  return new NextResponse(Buffer.from(combined), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${slug}-bundle.zip"`,
      'Content-Length': String(combined.length),
    },
  })
}
