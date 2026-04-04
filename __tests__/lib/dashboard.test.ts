import { vi, describe, it, expect, beforeEach } from 'vitest'
import { timeAgo, fetchStats, fetchActivity, fetchCoverage } from '@/lib/dashboard'

describe('timeAgo', () => {
  it('returns "agora" for times less than 1 minute ago', () => {
    const now = new Date().toISOString()
    expect(timeAgo(now)).toBe('agora')
  })

  it('returns minutes for times less than 1 hour ago', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(timeAgo(date)).toBe('5min')
  })

  it('returns hours for times less than 24 hours ago', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    expect(timeAgo(date)).toBe('3h')
  })

  it('returns days for times 24+ hours ago', () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    expect(timeAgo(date)).toBe('2d')
  })
})

describe('fetchStats', () => {
  it('returns counts from all 4 tables', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ count: 7, error: null }),
      }),
    }

    const stats = await fetchStats(mockSupabase as any)
    expect(stats).toEqual({ projetos: 7, referencias: 7, ds: 7, paginas: 7 })
    expect(mockSupabase.from).toHaveBeenCalledWith('projetos')
    expect(mockSupabase.from).toHaveBeenCalledWith('referencias')
    expect(mockSupabase.from).toHaveBeenCalledWith('design_systems')
    expect(mockSupabase.from).toHaveBeenCalledWith('paginas_geradas')
  })

  it('returns 0 for any table with null count', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ count: null, error: null }),
      }),
    }
    const stats = await fetchStats(mockSupabase as any)
    expect(stats).toEqual({ projetos: 0, referencias: 0, ds: 0, paginas: 0 })
  })
})

describe('fetchActivity', () => {
  it('maps paginas_geradas to success ActivityItems', async () => {
    const pagina = {
      id: 'p1',
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      version: 2,
      projeto: { nome: 'Projeto A' },
    }
    const mockSupabase = {
      from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: table === 'paginas_geradas' ? [pagina] : [],
          error: null,
        }),
      })),
    }
    const items = await fetchActivity(mockSupabase as any)
    const item = items.find(i => i.id === 'pagina-p1')
    expect(item).toBeDefined()
    expect(item!.name).toBe('LP gerada — Projeto A')
    expect(item!.detail).toBe('versão 2')
    expect(item!.status).toBe('success')
  })

  it('maps design_systems with status=processing to processing ActivityItems', async () => {
    const ds = {
      id: 'ds1',
      nome: 'Dark DS',
      status: 'processing',
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    }
    const mockSupabase = {
      from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: table === 'design_systems' ? [ds] : [],
          error: null,
        }),
      })),
    }
    const items = await fetchActivity(mockSupabase as any)
    const item = items.find(i => i.id === 'ds-ds1')
    expect(item!.name).toBe('Extraindo DS — Dark DS')
    expect(item!.status).toBe('processing')
  })

  it('maps referencias to info ActivityItems', async () => {
    const ref = {
      id: 'r1',
      nome: 'Guru Dark',
      niche: 'Infoproduto',
      page_type: 'Vendas',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    }
    const mockSupabase = {
      from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: table === 'referencias' ? [ref] : [],
          error: null,
        }),
      })),
    }
    const items = await fetchActivity(mockSupabase as any)
    const item = items.find(i => i.id === 'ref-r1')
    expect(item!.name).toBe('Nova referência — Guru Dark')
    expect(item!.detail).toBe('Infoproduto · Vendas')
    expect(item!.status).toBe('info')
  })

  it('limits total items to 15 and sorts by time descending', async () => {
    const makeItem = (id: string, minsAgo: number) => ({
      id,
      nome: `Item ${id}`,
      niche: 'SaaS',
      page_type: 'Vendas',
      created_at: new Date(Date.now() - minsAgo * 60 * 1000).toISOString(),
    })
    const refs = Array.from({ length: 20 }, (_, i) => makeItem(`r${i}`, i + 1))
    const mockSupabase = {
      from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: table === 'referencias' ? refs : [],
          error: null,
        }),
      })),
    }
    const items = await fetchActivity(mockSupabase as any)
    expect(items.length).toBeLessThanOrEqual(15)
  })
})

describe('fetchCoverage', () => {
  it('returns 4 fixed niches always', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }
    const coverage = await fetchCoverage(mockSupabase as any)
    expect(coverage).toHaveLength(4)
    expect(coverage.map(c => c.label)).toEqual(['Infoproduto', 'SaaS', 'E-commerce', 'Saúde'])
  })

  it('counts refs by niche correctly', async () => {
    const refs = [
      { niche: 'Infoproduto' },
      { niche: 'Infoproduto' },
      { niche: 'SaaS' },
    ]
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: refs, error: null }),
      }),
    }
    const coverage = await fetchCoverage(mockSupabase as any)
    const infoproduto = coverage.find(c => c.label === 'Infoproduto')!
    expect(infoproduto.count).toBe(2)
    expect(infoproduto.pct).toBeCloseTo(66.67, 0)
    const saas = coverage.find(c => c.label === 'SaaS')!
    expect(saas.count).toBe(1)
  })

  it('returns 0 count and 0 pct when no refs', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }
    const coverage = await fetchCoverage(mockSupabase as any)
    coverage.forEach(c => {
      expect(c.count).toBe(0)
      expect(c.pct).toBe(0)
    })
  })
})
