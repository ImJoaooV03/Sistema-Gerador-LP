import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import JSZip from 'jszip'

const ANTHROPIC_PROMPT = `Você receberá o código-fonte completo de uma landing page (HTML + CSS).
Analise tudo e gere um arquivo design-system.html completo, auto-contido e visualmente rico.

O arquivo deve documentar TODOS os seguintes elementos com exemplos renderizados:

IDENTIDADE VISUAL
- Paleta de cores completa: primária, secundária, accent, neutras, semânticas (sucesso/erro/alerta)
- Gradientes utilizados
- Background colors e superfícies

TIPOGRAFIA
- Famílias de fonte (display, body, mono) com exemplos reais
- Escala completa de tamanhos (h1 → h2 → h3 → p → small → caption)
- Pesos (font-weight) e line-heights
- Letter-spacing por nível

LAYOUT & ESPAÇAMENTO
- Escala de espaçamento identificada (4px, 8px, 16px, 24px, 32px...)
- Largura máxima do container e grid
- Breakpoints responsivos detectados
- Border-radius usados
- Padrão de padding de seções

COMPONENTES
- Botões: primário, secundário, ghost, outline — com hover state descrito
- Inputs e formulários
- Cards e containers
- Badges, tags, pills
- Separadores e divisores

DOBRAS / SEÇÕES DA LP
- Estrutura identificada de cada dobra (Hero, Benefícios, Prova Social, Oferta, CTA, etc.)
- Padrão visual de cada tipo de seção
- Como os CTAs são apresentados em cada dobra

EFEITOS & MOVIMENTO
- Box-shadows e text-shadows usados
- Animações e transições (CSS keyframes, transitions)
- Efeitos de hover
- Overlays, opacidades, blur

FORMATO DO OUTPUT:
- HTML único, auto-contido (sem CDN externo), com CSS inline no <style>
- Visual dark ou light seguindo o tema da LP original
- Cada seção bem delimitada com heading claro
- Swatches de cor renderizados como divs coloridos com hex values
- Todos os exemplos de tipografia renderizados nas fontes reais
- Botões e componentes renderizados funcionalmente
- Código-fonte limpo, organizado em seções com comentários

Responda APENAS com o HTML completo. Sem explicações, sem markdown. Comece com <!DOCTYPE html>.

CÓDIGO-FONTE DA LP:
`

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Auth check
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

    // Validate ZIP contains index.html
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

    // Upload ZIP to Storage
    const { error: storageErr } = await supabase.storage
      .from('design-systems')
      .upload(`${id}.zip`, file, { contentType: 'application/zip', upsert: true })

    if (storageErr) throw new Error(`Storage: ${storageErr.message}`)

    // Update storage_path
    await supabase.from('design_systems').update({ storage_path: `${id}.zip` }).eq('id', id)

    // Extract HTML + CSS source for Claude
    const indexHtml = await zip.file('index.html')!.async('string')

    // Extract all .css files referenced in <link> tags
    const cssLinks = [...indexHtml.matchAll(/<link[^>]+href="([^"]+\.css)"/gi)]
      .map(m => m[1].replace(/^\//, ''))

    let cssContent = ''
    for (const cssPath of cssLinks) {
      const cssFile = zip.file(cssPath)
      if (cssFile) {
        cssContent += `\n/* === ${cssPath} === */\n`
        cssContent += await cssFile.async('string')
      }
    }

    // Extract inline <style> blocks
    const styleBlocks = [...indexHtml.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
      .map(m => m[1])
      .join('\n')

    const sourceCode = `${indexHtml}\n\n/* External CSS */\n${cssContent}\n\n/* Inline Styles */\n${styleBlocks}`

    // Call Claude API
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8192,
      messages: [{ role: 'user', content: ANTHROPIC_PROMPT + sourceCode }],
    })

    const dsHtml = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    // Save ds_html + mark done
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
