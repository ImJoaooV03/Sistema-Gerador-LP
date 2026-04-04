import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import JSZip from 'jszip'
import type { PageSection } from '@/lib/types'
import { getConfiguracoes } from '@/lib/get-configuracoes'
import { DEFAULT_MODELO_LP } from '@/lib/defaults'

type EditCodigoBody = {
  pagina_id: string
  section_id: string
  modo: 'codigo'
  html: string
}

type EditIABody = {
  pagina_id: string
  section_id: string
  modo: 'ia'
  instrucao: string
  modelo?: string
}

type EditBody = EditCodigoBody | EditIABody

async function getDesignSystemContext(referenciaIds: string[]): Promise<string> {
  const admin = createAdminClient()
  const dsParts: string[] = []

  for (const id of referenciaIds.slice(0, 2)) {
    const { data: zipData } = await admin.storage.from('referencias').download(`${id}.zip`)
    if (!zipData) continue

    const buffer = await zipData.arrayBuffer()
    const zip = await JSZip.loadAsync(buffer)
    const dsFile = zip.file('design-system.html')
    if (dsFile) {
      dsParts.push(await dsFile.async('string'))
    }
  }

  return dsParts.join('\n\n---\n\n')
}

function rebuildHtmlOutput(fullHtml: string, oldSectionHtml: string, newSectionHtml: string): string {
  if (oldSectionHtml && fullHtml.includes(oldSectionHtml)) {
    return fullHtml.replace(oldSectionHtml, newSectionHtml)
  }
  return fullHtml
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const body = await req.json() as EditBody

    if (!body.pagina_id || !body.section_id || !body.modo) {
      return NextResponse.json({ error: 'pagina_id, section_id e modo são obrigatórios' }, { status: 400 })
    }

    // Fetch pagina
    const { data: pagina, error: pErr } = await supabase
      .from('paginas_geradas')
      .select('id, html_output, sections, metadata')
      .eq('id', body.pagina_id)
      .single()

    if (pErr || !pagina) return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })

    const sections = (pagina.sections ?? []) as PageSection[]
    const sectionIdx = sections.findIndex(s => s.id === body.section_id)
    if (sectionIdx === -1) return NextResponse.json({ error: 'Seção não encontrada' }, { status: 404 })

    const currentSection = sections[sectionIdx]
    let newSectionHtml = currentSection.html

    if (body.modo === 'codigo') {
      newSectionHtml = (body as EditCodigoBody).html
    } else {
      // Modo IA: Claude rewrites the section
      const iaBody = body as EditIABody
      if (!iaBody.instrucao?.trim()) {
        return NextResponse.json({ error: 'instrucao é obrigatória no modo IA' }, { status: 400 })
      }

      const metadata = (pagina.metadata ?? {}) as { referencias_ids?: string[]; modelo?: string }
      const dsContext = metadata.referencias_ids?.length
        ? await getDesignSystemContext(metadata.referencias_ids)
        : ''

      const config = await getConfiguracoes()
      const modelo = iaBody.modelo || metadata.modelo || config.modelo_lp || DEFAULT_MODELO_LP

      const prompt = `Você está editando uma seção de uma landing page.

## INSTRUÇÃO DO USUÁRIO
${iaBody.instrucao}

## HTML ATUAL DA SEÇÃO (${currentSection.label})
${currentSection.html}

${dsContext ? `## DESIGN SYSTEM DAS REFERÊNCIAS (use APENAS estas classes CSS)
${dsContext.slice(0, 30000)}` : ''}

## REGRAS
1. Reescreva APENAS a seção acima conforme a instrução.
2. Use SOMENTE classes CSS presentes no design system acima.
3. Mantenha a estrutura semântica da seção.
4. Retorne APENAS o HTML da seção, sem <!DOCTYPE>, sem <html>, sem <head>, sem <body>.
5. Comece diretamente com a tag da seção (ex: <section>, <div>, etc).`

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const message = await anthropic.messages.create({
        model: modelo,
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }],
      })

      newSectionHtml = message.content
        .filter(b => b.type === 'text')
        .map(b => (b as { type: 'text'; text: string }).text)
        .join('')
        .trim()
    }

    // Update sections array
    const updatedSections = sections.map((s, i) =>
      i === sectionIdx ? { ...s, html: newSectionHtml } : s
    )

    // Rebuild html_output
    const newHtmlOutput = rebuildHtmlOutput(
      pagina.html_output ?? '',
      currentSection.html,
      newSectionHtml
    )

    // Save (no version increment)
    const { error: updateErr } = await supabase
      .from('paginas_geradas')
      .update({ sections: updatedSections, html_output: newHtmlOutput })
      .eq('id', body.pagina_id)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    return NextResponse.json({
      section: { ...currentSection, html: newSectionHtml },
      html_output: newHtmlOutput,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
