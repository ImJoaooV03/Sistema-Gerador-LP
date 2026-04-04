import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import JSZip from 'jszip'
import type { PageSection } from '@/lib/types'
import { getConfiguracoes } from '@/lib/get-configuracoes'
import { DEFAULT_PROMPT_LP, DEFAULT_MODELO_LP } from '@/lib/defaults'

function buildReferencesBlock(refs: Array<{ nome: string; indexHtml: string; dsHtml: string }>): string {
  return refs.map((r, i) =>
    `### Referência ${i + 1}: ${r.nome}\n**index.html:**\n${r.indexHtml.slice(0, 40000)}\n\n**design-system.html:**\n${r.dsHtml.slice(0, 20000)}`
  ).join('\n\n---\n\n')
}

function parseLPOutput(raw: string): { html: string; sections: PageSection[] } {
  const htmlMatch = raw.match(/<LP_HTML>([\s\S]*?)<\/LP_HTML>/)
  const sectionsMatch = raw.match(/<LP_SECTIONS>([\s\S]*?)<\/LP_SECTIONS>/)

  const html = htmlMatch?.[1]?.trim() ?? ''
  let sections: PageSection[] = []

  if (sectionsMatch) {
    try {
      sections = JSON.parse(sectionsMatch[1].trim())
    } catch {
      sections = []
    }
  }

  return { html, sections }
}

function rankByTagOverlap(
  refs: Array<{ id: string; tags: string[]; nome: string }>,
  briefingKeywords: string[]
): Array<{ id: string; tags: string[]; nome: string }> {
  return [...refs].sort((a, b) => {
    const scoreA = a.tags.filter(t => briefingKeywords.some(k => t.toLowerCase().includes(k))).length
    const scoreB = b.tags.filter(t => briefingKeywords.some(k => t.toLowerCase().includes(k))).length
    return scoreB - scoreA
  })
}

async function runGeneration(projetoId: string, modelo: string) {
  const admin = createAdminClient()

  try {
    const config = await getConfiguracoes()
    const promptLp = config.prompt_lp ?? DEFAULT_PROMPT_LP
    // Mark job as running
    await admin.from('jobs').update({ status: 'running' }).eq('payload->>projeto_id', projetoId).eq('status', 'pending')

    // Fetch job id (needed for final update)
    const { data: jobs } = await admin
      .from('jobs')
      .select('id')
      .eq('payload->>projeto_id', projetoId)
      .eq('status', 'running')
      .order('created_at', { ascending: false })
      .limit(1)

    const jobId = jobs?.[0]?.id

    // Fetch project
    const { data: projeto } = await admin
      .from('projetos')
      .select('*')
      .eq('id', projetoId)
      .single()

    if (!projeto) throw new Error('Projeto não encontrado')

    // Select references: exact match first, fallback to niche only
    let { data: refs } = await admin
      .from('referencias')
      .select('id, nome, niche, sub_niche, page_type, tags, storage_path')
      .eq('niche', projeto.niche)
      .eq('sub_niche', projeto.sub_niche)
      .eq('page_type', projeto.page_type)

    if (!refs || refs.length < 2) {
      const { data: fallback } = await admin
        .from('referencias')
        .select('id, nome, niche, sub_niche, page_type, tags, storage_path')
        .eq('niche', projeto.niche)
      refs = fallback ?? []
    }

    if (!refs || refs.length === 0) throw new Error('Nenhuma referência encontrada para este projeto')

    // Rank by tag overlap with briefing keywords
    const briefingKeywords = (projeto.briefing ?? '')
      .toLowerCase()
      .split(/\s+/)
      .filter((w: string) => w.length > 4)

    const ranked = rankByTagOverlap(refs, briefingKeywords)
    const selected = ranked.slice(0, 3)

    // Download ZIPs and extract HTML for each reference
    const refsContent: Array<{ nome: string; indexHtml: string; dsHtml: string }> = []

    for (const ref of selected) {
      const { data: zipData, error: dlErr } = await admin.storage
        .from('referencias')
        .download(`${ref.id}.zip`)

      if (dlErr || !zipData) continue

      const buffer = await zipData.arrayBuffer()
      const zip = await JSZip.loadAsync(buffer)

      const indexFile = zip.file('index.html')
      const dsFile = zip.file('design-system.html')

      const indexHtml = indexFile ? await indexFile.async('string') : ''
      const dsHtml = dsFile ? await dsFile.async('string') : ''

      refsContent.push({ nome: ref.nome, indexHtml, dsHtml })
    }

    if (refsContent.length === 0) throw new Error('Não foi possível carregar o conteúdo das referências')

    // Build prompt
    const prompt = promptLp
      .replace('{NOME}', projeto.nome)
      .replace('{NICHE}', projeto.niche)
      .replace('{SUB_NICHE}', projeto.sub_niche)
      .replace('{PAGE_TYPE}', projeto.page_type)
      .replace('{BRIEFING}', projeto.briefing ?? '')
      .replace('{REFERENCIAS}', buildReferencesBlock(refsContent))

    // Call Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: modelo,
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawOutput = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    const { html, sections } = parseLPOutput(rawOutput)

    if (!html) throw new Error('Claude não retornou HTML válido')

    // Get current max version for this project
    const { data: existingPages } = await admin
      .from('paginas_geradas')
      .select('version')
      .eq('projeto_id', projetoId)
      .order('version', { ascending: false })
      .limit(1)

    const nextVersion = (existingPages?.[0]?.version ?? 0) + 1

    // Save pagina_gerada
    const { data: pagina } = await admin
      .from('paginas_geradas')
      .insert({
        projeto_id: projetoId,
        html_output: html,
        sections: sections,
        version: nextVersion,
        metadata: {
          referencias_ids: selected.map(r => r.id),
          modelo,
        },
      })
      .select('id')
      .single()

    // Update project status
    await admin.from('projetos').update({ status: 'concluido' }).eq('id', projetoId)

    // Update job status
    if (jobId) {
      await admin.from('jobs')
        .update({ status: 'done', result: { pagina_id: pagina?.id } })
        .eq('id', jobId)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)

    // Update project back to rascunho
    await admin.from('projetos').update({ status: 'rascunho' }).eq('id', projetoId)

    // Update job to error
    const { data: jobs } = await admin
      .from('jobs')
      .select('id')
      .eq('payload->>projeto_id', projetoId)
      .in('status', ['pending', 'running'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (jobs?.[0]?.id) {
      await admin.from('jobs')
        .update({ status: 'error', error: msg })
        .eq('id', jobs[0].id)
    }
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const body = await req.json() as { projeto_id?: string; modelo?: string }
    const projetoId = body.projeto_id?.trim()
    const config = await getConfiguracoes()
    const modelo = body.modelo?.trim() || config.modelo_lp || DEFAULT_MODELO_LP

    if (!projetoId) return NextResponse.json({ error: 'projeto_id obrigatório' }, { status: 400 })

    // Validate project exists and belongs to authenticated context
    const { data: projeto, error: projetoErr } = await supabase
      .from('projetos')
      .select('id, nome, niche, sub_niche, page_type, briefing, status')
      .eq('id', projetoId)
      .single()

    if (projetoErr || !projeto) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    if (!projeto.briefing?.trim()) return NextResponse.json({ error: 'Projeto sem briefing' }, { status: 400 })
    if (projeto.status === 'gerando') return NextResponse.json({ error: 'Geração já em andamento' }, { status: 409 })

    // Create job
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .insert({
        type: 'lp_generation',
        status: 'pending',
        payload: { projeto_id: projetoId, modelo },
      })
      .select('id')
      .single()

    if (jobErr || !job) return NextResponse.json({ error: 'Erro ao criar job' }, { status: 500 })

    // Update project status
    await supabase.from('projetos').update({ status: 'gerando' }).eq('id', projetoId)

    // Run generation in background (after response is sent)
    after(() => runGeneration(projetoId, modelo))

    return NextResponse.json({ job_id: job.id }, { status: 202 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
