import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { ProjetoCard } from '@/components/projetos/projeto-card'
import type { Projeto } from '@/lib/types'

const projeto: Projeto = {
  id: 'p1',
  cliente_id: 'c1',
  nome: 'LP Curso de Inglês',
  niche: 'Infoproduto',
  sub_niche: 'Curso Online',
  page_type: 'Vendas (long form)',
  briefing: null,
  status: 'rascunho',
  created_at: '2026-04-02T00:00:00Z',
}

describe('ProjetoCard', () => {
  it('renders project name', () => {
    render(<ProjetoCard projeto={projeto} clienteNome="Acme" onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('LP Curso de Inglês')).toBeInTheDocument()
  })

  it('renders cliente name', () => {
    render(<ProjetoCard projeto={projeto} clienteNome="Acme Corp" onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('renders niche and sub_niche tags', () => {
    render(<ProjetoCard projeto={projeto} clienteNome="Acme" onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Infoproduto')).toBeInTheDocument()
    expect(screen.getByText('Curso Online')).toBeInTheDocument()
  })

  it('renders Rascunho status badge', () => {
    render(<ProjetoCard projeto={projeto} clienteNome="Acme" onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Rascunho')).toBeInTheDocument()
  })

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn()
    render(<ProjetoCard projeto={projeto} clienteNome="Acme" onEdit={onEdit} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    expect(onEdit).toHaveBeenCalledWith(projeto)
  })
})
