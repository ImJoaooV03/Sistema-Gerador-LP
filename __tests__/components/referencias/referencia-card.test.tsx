import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { ReferenciaCard } from '@/components/referencias/referencia-card'
import type { Referencia } from '@/lib/types'

const ref: Referencia = {
  id: 'r1',
  design_system_id: null,
  nome: 'LP Infoproduto Hero',
  niche: 'Infoproduto',
  sub_niche: 'Curso Online',
  page_type: 'Vendas (long form)',
  tags: [],
  observacoes: null,
  storage_path: 'r1.zip',
  created_at: '2026-04-03T00:00:00Z',
}

describe('ReferenciaCard', () => {
  it('renders nome', () => {
    render(<ReferenciaCard referencia={ref} onClick={vi.fn()} />)
    expect(screen.getByText('LP Infoproduto Hero')).toBeInTheDocument()
  })

  it('renders niche tag', () => {
    render(<ReferenciaCard referencia={ref} onClick={vi.fn()} />)
    expect(screen.getByText('Infoproduto')).toBeInTheDocument()
  })
})
