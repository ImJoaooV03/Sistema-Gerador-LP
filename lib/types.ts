export type Cliente = {
  id: string
  nome: string
  contato: string | null
  created_at: string
}

export type Projeto = {
  id: string
  cliente_id: string
  nome: string
  niche: string
  sub_niche: string
  page_type: string
  briefing: string | null
  created_at: string
}

export type DesignSystem = {
  id: string
  nome: string
  storage_path: string
  created_at: string
}

export type Referencia = {
  id: string
  design_system_id: string | null
  nome: string
  niche: string
  sub_niche: string | null
  page_type: string | null
  tags: string[]
  observacoes: string | null
  storage_path: string
  created_at: string
}

export type PageSection = {
  id: string         // ex: "hero", "problema", "solucao"
  label: string      // ex: "Hero", "Problema", "Solução"
  html: string       // HTML da seção isolada
  order: number
}

export type PaginaGerada = {
  id: string
  projeto_id: string
  html_output: string | null
  preview_url: string | null
  sections: PageSection[]
  version: number
  created_at: string
}

export type JobType = 'ds_extraction' | 'lp_generation'
export type JobStatus = 'pending' | 'running' | 'done' | 'error'

export type Job = {
  id: string
  type: JobType
  status: JobStatus
  payload: Record<string, unknown>
  result: Record<string, unknown> | null
  error: string | null
  created_at: string
}
