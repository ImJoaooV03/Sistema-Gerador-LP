import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import JSZip from 'jszip'
import { getConfiguracoes } from '@/lib/get-configuracoes'
import { DEFAULT_PROMPT_DS, DEFAULT_MODELO_DS } from '@/lib/defaults'
import { buildAnalysisHtml, stripMarkdown } from '@/lib/ds-resolver'

export const maxDuration = 300

const MAX_SOURCE = 200_000

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Fetch record (RLS ensures it belongs to the authed user)
  const { data: ds, error: fetchErr } = await supabase
    .from('design_systems')
    .select('id, nome, storage_path, status')
    .eq('id', id)
    .single()

  if (fetchErr || !ds) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    await supabase.from('design_systems').update({ status: 'processing' }).eq('id', id)

    // Download ZIP from Storage (admin client bypasses RLS)
    const admin = createAdminClient()
    const { data: zipBlob, error: dlErr } = await admin.storage
      .from('design-systems')
      .download(ds.storage_path)

    if (dlErr || !zipBlob) throw new Error(`Storage download: ${dlErr?.message ?? 'unknown'}`)

    const buffer = await zipBlob.arrayBuffer()
    const zip = await JSZip.loadAsync(buffer)

    // Build analysis HTML for Claude
    let analysisHtml = await buildAnalysisHtml(zip)
    if (analysisHtml.length > MAX_SOURCE) {
      analysisHtml = analysisHtml.slice(0, MAX_SOURCE) + '\n\n<!-- [truncado por tamanho] -->'
    }

    // Call Claude
    const config = await getConfiguracoes()
    const promptDs = config.prompt_ds ?? DEFAULT_PROMPT_DS
    const modeloDs = config.modelo_ds ?? DEFAULT_MODELO_DS
    const anthropic = new Anthropic({
      apiKey: config.anthropic_key ?? process.env.ANTHROPIC_API_KEY,
      timeout: 5 * 60 * 1000,
    })

    const stream = anthropic.messages.stream({
      model: modeloDs,
      max_tokens: 32000,
      messages: [{ role: 'user', content: promptDs + analysisHtml }],
    })
    const message = await stream.finalMessage()

    let dsHtml = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    dsHtml = stripMarkdown(dsHtml)

    if (message.stop_reason === 'max_tokens') {
      if (!dsHtml.includes('</body>')) {
        if (dsHtml.includes('<style') && !dsHtml.includes('</style>')) {
          dsHtml += '\n</style>'
        }
        dsHtml += '\n</body></html>'
      }
    }

    await supabase
      .from('design_systems')
      .update({ ds_html: dsHtml, status: 'done' })
      .eq('id', id)

    return NextResponse.json({ id, status: 'done', ds_html: dsHtml })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await supabase.from('design_systems').update({ status: 'error', error_msg: msg }).eq('id', id)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
