import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import JSZip from 'jszip'
import { getConfiguracoes } from '@/lib/get-configuracoes'
import { DEFAULT_PROMPT_DS, DEFAULT_MODELO_DS } from '@/lib/defaults'
import { buildAnalysisHtml, stripMarkdown } from '@/lib/ds-resolver'

export const maxDuration = 300 // 5 minutes — required for large ZIPs + Opus

// Higher cap now safe: no base64 images in analysis HTML.
// CSS + HTML structure for a full LP typically fits well within 200k chars.
const MAX_SOURCE = 200_000

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  let id: string | null = null

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const nome = (formData.get('nome') as string | null)?.trim()

    if (!file || !nome) {
      return NextResponse.json({ error: 'file e nome são obrigatórios' }, { status: 400 })
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande (máx 50MB)' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(buffer)

    if (!zip.file('index.html')) {
      return NextResponse.json({ error: 'ZIP deve conter index.html na raiz' }, { status: 400 })
    }

    // Insert record with status = processing
    const { data: ds, error: insertErr } = await supabase
      .from('design_systems')
      .insert({ nome, storage_path: '', status: 'processing' })
      .select('id')
      .single()

    if (insertErr || !ds) {
      return NextResponse.json({ error: insertErr?.message ?? 'DB error' }, { status: 500 })
    }
    id = ds.id

    // Upload ZIP to Storage (admin client bypasses RLS)
    const admin = createAdminClient()
    const { error: storageErr } = await admin.storage
      .from('design-systems')
      .upload(`${id}.zip`, file, { contentType: 'application/zip', upsert: true })

    if (storageErr) throw new Error(`Storage: ${storageErr.message}`)

    await supabase.from('design_systems').update({ storage_path: `${id}.zip` }).eq('id', id)

    // Build analysis HTML: CSS/JS embedded inline, small SVGs inlined, images left as-is.
    // Images are intentionally NOT base64-encoded here — a 200KB image becomes 267k chars
    // of base64 which would consume the entire context budget before Claude sees any CSS.
    // Claude reads CSS for design tokens (colors, typography, spacing), not image pixels.
    let analysisHtml = await buildAnalysisHtml(zip)

    // Cap to stay within Claude's context window
    if (analysisHtml.length > MAX_SOURCE) {
      analysisHtml = analysisHtml.slice(0, MAX_SOURCE) + '\n\n<!-- [truncado por tamanho] -->'
    }

    // Call Claude
    const config = await getConfiguracoes()
    const promptDs = config.prompt_ds ?? DEFAULT_PROMPT_DS
    const modeloDs = config.modelo_ds ?? DEFAULT_MODELO_DS
    const anthropic = new Anthropic({
      apiKey: config.anthropic_key ?? process.env.ANTHROPIC_API_KEY,
      timeout: 5 * 60 * 1000, // 5 minutes
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

    // Close unclosed tags if truncated
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
    if (id) {
      const supabase2 = await createClient()
      await supabase2.from('design_systems').update({ status: 'error', error_msg: msg }).eq('id', id)
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
