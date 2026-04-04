import type { SupabaseClient } from '@supabase/supabase-js'

// ── Types ─────────────────────────────────────────────────────────────────────

export type DashboardStats = {
  projetos:   number
  referencias: number
  ds:         number
  paginas:    number
}

export type ActivityItem = {
  id:     string
  name:   string
  detail: string
  time:   string
  status: 'success' | 'processing' | 'info'
}

export type CoverageItem = {
  label: string
  count: number
  pct:   number
  color: string
}

// ── timeAgo ───────────────────────────────────────────────────────────────────

export function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)  return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24)   return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// ── fetchStats ────────────────────────────────────────────────────────────────

export async function fetchStats(supabase: SupabaseClient): Promise<DashboardStats> {
  const [p, r, d, pg] = await Promise.all([
    supabase.from('projetos').select('*',       { count: 'exact', head: true }),
    supabase.from('referencias').select('*',     { count: 'exact', head: true }),
    supabase.from('design_systems').select('*',  { count: 'exact', head: true }),
    supabase.from('paginas_geradas').select('*', { count: 'exact', head: true }),
  ])
  return {
    projetos:    p.count  ?? 0,
    referencias: r.count  ?? 0,
    ds:          d.count  ?? 0,
    paginas:     pg.count ?? 0,
  }
}

// ── fetchActivity ─────────────────────────────────────────────────────────────

export async function fetchActivity(supabase: SupabaseClient): Promise<ActivityItem[]> {
  const [paginasRes, dsRes, refsRes] = await Promise.all([
    supabase
      .from('paginas_geradas')
      .select('id, created_at, version, projeto:projetos(nome)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('design_systems')
      .select('id, nome, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('referencias')
      .select('id, nome, niche, page_type, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const items: ActivityItem[] = []

  for (const p of paginasRes.data ?? []) {
    const projeto = p.projeto as unknown as { nome: string } | null
    items.push({
      id:     `pagina-${p.id}`,
      name:   `LP gerada — ${projeto?.nome ?? 'Projeto'}`,
      detail: `versão ${p.version}`,
      time:   timeAgo(p.created_at),
      status: 'success',
    })
  }

  for (const ds of dsRes.data ?? []) {
    items.push({
      id:     `ds-${ds.id}`,
      name:   ds.status === 'processing' ? `Extraindo DS — ${ds.nome}` : `Design System — ${ds.nome}`,
      detail: ds.status === 'processing' ? 'processando...' : 'extração concluída',
      time:   timeAgo(ds.created_at),
      status: ds.status === 'processing' ? 'processing' : 'info',
    })
  }

  for (const ref of refsRes.data ?? []) {
    items.push({
      id:     `ref-${ref.id}`,
      name:   `Nova referência — ${ref.nome}`,
      detail: `${ref.niche} · ${ref.page_type}`,
      time:   timeAgo(ref.created_at),
      status: 'info',
    })
  }

  return items.slice(0, 15)
}

// ── fetchCoverage ─────────────────────────────────────────────────────────────

const FIXED_NICHES: Array<{ label: string; color: string }> = [
  { label: 'Infoproduto', color: '#F0B429' },
  { label: 'SaaS',        color: '#00D4AA' },
  { label: 'E-commerce',  color: '#A78BFA' },
  { label: 'Saúde',       color: '#60A5FA' },
]

export async function fetchCoverage(supabase: SupabaseClient): Promise<CoverageItem[]> {
  const { data } = await supabase.from('referencias').select('niche')
  const refs = data ?? []
  const total = refs.length

  const countByNiche = refs.reduce<Record<string, number>>((acc, r) => {
    acc[r.niche] = (acc[r.niche] ?? 0) + 1
    return acc
  }, {})

  return FIXED_NICHES.map(({ label, color }) => {
    const count = countByNiche[label] ?? 0
    return {
      label,
      count,
      pct:   total > 0 ? (count / total) * 100 : 0,
      color,
    }
  })
}
