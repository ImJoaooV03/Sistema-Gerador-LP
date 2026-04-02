export const NICHES: Record<string, string[]> = {
  'Infoproduto': ['Curso Online', 'Mentoria', 'Ebook', 'Evento', 'Comunidade'],
  'SaaS':        ['B2B', 'B2C', 'Produtividade', 'Fintech', 'EdTech'],
  'E-commerce':  ['Moda', 'Saúde', 'Eletrônicos', 'Casa', 'Suplementos'],
  'Saúde':       ['Fitness', 'Nutrição', 'Emagrecimento', 'Medicina', 'Estética'],
  'Serviços':    ['Agência', 'Consultoria', 'Coaching', 'Freelancer'],
}

export const NICHE_KEYS = Object.keys(NICHES) as Array<keyof typeof NICHES>

export const PAGE_TYPES = [
  'Vendas (long form)',
  'Webinar',
  'Squeeze',
  'VSL',
  'Mentoria',
  'Lançamento',
] as const

export type PageType = typeof PAGE_TYPES[number]
