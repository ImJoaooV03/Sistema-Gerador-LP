import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import { getConfiguracoes } from '@/lib/get-configuracoes'
import { DEFAULT_PROMPT_DS, DEFAULT_MODELO_DS } from '@/lib/defaults'
import { buildAnalysisHtmlFromUrl, stripMarkdown } from '@/lib/ds-resolver'

export const maxDuration = 300

const MAX_SOURCE = 200_000

async function runExtractionFromUrl(id: string, url: string) {
  const admin = createAdminClient()

  try {
    let analysisHtml = await buildAnalysisHtmlFromUrl(url)
    if (analysisHtml.length > MAX_SOURCE) {
      analysisHtml = analysisHtml.slice(0, MAX_SOURCE) + '\n\n<!-- [truncado por tamanho] -->'
    }

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

    await admin.from('design_systems').update({ ds_html: dsHtml, status: 'done' }).eq('id', id)

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await admin.from('design_systems').update({ status: 'error', error_msg: msg }).eq('id', id)
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  let body: { nome?: string; url?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const nome = (body.nome ?? '').trim()
  const url  = (body.url  ?? '').trim()

  if (!nome) return NextResponse.json({ error: 'nome é obrigatório' }, { status: 400 })
  if (!url)  return NextResponse.json({ error: 'url é obrigatória' }, { status: 400 })
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return NextResponse.json({ error: 'url deve começar com http:// ou https://' }, { status: 400 })
  }

  const { data: ds, error: insertErr } = await supabase
    .from('design_systems')
    .insert({ nome, storage_path: '', status: 'pending' })
    .select('id')
    .single()

  if (insertErr || !ds) {
    return NextResponse.json({ error: insertErr?.message ?? 'DB error' }, { status: 500 })
  }

  await supabase.from('design_systems').update({ status: 'processing' }).eq('id', ds.id)

  after(() => runExtractionFromUrl(ds.id, url))

  return NextResponse.json({ id: ds.id, status: 'processing' }, { status: 202 })
}
