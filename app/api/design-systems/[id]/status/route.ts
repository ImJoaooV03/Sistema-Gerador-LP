import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 10

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: ds, error } = await supabase
    .from('design_systems')
    .select('id, status, ds_html, error_msg')
    .eq('id', id)
    .single()

  if (error || !ds) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id: ds.id,
    status: ds.status,
    ds_html: ds.ds_html ?? null,
    error_msg: ds.error_msg ?? null,
  })
}
