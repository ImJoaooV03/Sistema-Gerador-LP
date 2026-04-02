import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

import { ProjetoDrawer } from '@/components/projetos/projeto-drawer'
import type { Cliente } from '@/lib/types'

const clientes: Cliente[] = [
  { id: 'c1', nome: 'Acme Corp', contato: null, created_at: '' },
]

describe('ProjetoDrawer', () => {
  it('renders create form when projeto is null', () => {
    render(<ProjetoDrawer open={true} projeto={null} clientes={clientes} onClose={vi.fn()} />)
    expect(screen.getByText('Novo Projeto')).toBeInTheDocument()
  })

  it('resets sub-niche options when niche changes', () => {
    render(<ProjetoDrawer open={true} projeto={null} clientes={clientes} onClose={vi.fn()} />)

    fireEvent.change(screen.getByRole('combobox', { name: /^niche$/i }), { target: { value: 'SaaS' } })

    expect(screen.getByRole('option', { name: 'B2B' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Fintech' })).toBeInTheDocument()
  })

  it('sub-niche options change when niche changes from one to another', () => {
    render(<ProjetoDrawer open={true} projeto={null} clientes={clientes} onClose={vi.fn()} />)

    fireEvent.change(screen.getByRole('combobox', { name: /^niche$/i }), { target: { value: 'Saúde' } })
    expect(screen.getByRole('option', { name: 'Fitness' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'B2B' })).not.toBeInTheDocument()
  })

  it('shows validation error when nome is empty on submit', async () => {
    render(<ProjetoDrawer open={true} projeto={null} clientes={clientes} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /criar projeto/i }))
    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument()
  })
})
