import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { DsCard } from '@/components/design-systems/ds-card'
import type { DesignSystem } from '@/lib/types'

const base: DesignSystem = {
  id: 'ds1',
  nome: 'Meu Design System',
  storage_path: 'ds1.zip',
  ds_html: null,
  status: 'pending',
  error_msg: null,
  created_at: '2026-04-03T00:00:00Z',
}

describe('DsCard', () => {
  it('renders name', () => {
    render(<DsCard ds={base} onClick={vi.fn()} />)
    expect(screen.getByText('Meu Design System')).toBeInTheDocument()
  })

  it('renders Aguardando for pending status', () => {
    render(<DsCard ds={base} onClick={vi.fn()} />)
    expect(screen.getByText('Aguardando')).toBeInTheDocument()
  })

  it('renders Extraindo for processing status', () => {
    render(<DsCard ds={{ ...base, status: 'processing' }} onClick={vi.fn()} />)
    expect(screen.getByText('Extraindo...')).toBeInTheDocument()
  })

  it('renders Concluído for done status', () => {
    render(<DsCard ds={{ ...base, status: 'done', ds_html: '<html/>' }} onClick={vi.fn()} />)
    expect(screen.getByText('Concluído')).toBeInTheDocument()
  })

  it('renders Erro for error status', () => {
    render(<DsCard ds={{ ...base, status: 'error', error_msg: 'falhou' }} onClick={vi.fn()} />)
    expect(screen.getByText('Erro')).toBeInTheDocument()
  })

  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn()
    render(<DsCard ds={{ ...base, status: 'done', ds_html: '<html/>' }} onClick={onClick} />)
    fireEvent.click(screen.getByText('Meu Design System'))
    expect(onClick).toHaveBeenCalledWith(base.id)
  })
})
