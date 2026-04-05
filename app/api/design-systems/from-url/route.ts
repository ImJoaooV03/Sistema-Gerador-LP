import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import { getConfiguracoes } from '@/lib/get-configuracoes'
import { DEFAULT_PROMPT_DS, DEFAULT_MODELO_DS } from '@/lib/defaults'
import { buildAnalysisHtmlFromUrl, stripMarkdown } from '@/lib/ds-resolver'

export const maxDuration = 300

const MAX_SOURCE = 40_000
const SOFT_DEADLINE_MS = 255_000 // 255s — leaves 45s buffer before the 300s hard kill

function raceTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  let t: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error(msg)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t!))
}

async function runExtractionFromUrl(id: string, url: string) {
  const admin = createAdminClient()
  const start = Date.now()

  try {
    let analysisHtml = await raceTimeout(
      buildAnalysisHtmlFromUrl(url),
      60_000,
      'Timeout ao buscar CSS da página (> 60s)',
    )
    if (analysisHtml.length > MAX_SOURCE) {
      analysisHtml = analysisHtml.slice(0, MAX_SOURCE) + '\n\n<!-- [truncado por tamanho] -->'
    }

    const config = await getConfiguracoes()
    const promptDs = config.prompt_ds ?? DEFAULT_PROMPT_DS
    const modeloDs = config.modelo_ds ?? DEFAULT_MODELO_DS
    const remainingMs = SOFT_DEADLINE_MS - (Date.now() - start)
    if (remainingMs < 10_000) throw new Error('Tempo insuficiente para análise do Claude')

    const anthropic = new Anthropic({
      apiKey: config.anthropic_key ?? process.env.ANTHROPIC_API_KEY,
      timeout: remainingMs,
    })

    // Prepend a compact-output instruction so Claude doesn't bloat <head> CSS
    // before writing any <body> content (URL sources have less resolved assets)
    const compactHint = 'IMPORTANTE: O HTML de saída deve ser compacto. Defina variáveis CSS em :root uma única vez e use-as. Não repita valores hex literalmente. Priorize gerar o conteúdo <body> completo antes de estilos auxiliares.\n\n'
    const stream = anthropic.messages.stream({
      model: modeloDs,
      max_tokens: 24000,
      messages: [{ role: 'user', content: compactHint + promptDs + analysisHtml }],
    })
    const message = await raceTimeout(
      stream.finalMessage(),
      remainingMs,
      'Timeout na análise do Claude (> 255s)',
    )

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
