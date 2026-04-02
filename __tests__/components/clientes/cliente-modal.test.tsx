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

import { ClienteModal } from '@/components/clientes/cliente-modal'
import type { Cliente } from '@/lib/types'

const onClose = vi.fn()

describe('ClienteModal', () => {
  it('renders create form when cliente is null', () => {
    render(<ClienteModal open={true} cliente={null} onClose={onClose} />)
    expect(screen.getByText('Novo Cliente')).toBeInTheDocument()
    expect(screen.getByLabelText(/nome/i)).toHaveValue('')
    expect(screen.getByLabelText(/contato/i)).toHaveValue('')
  })

  it('renders edit form with prefilled values', () => {
    const cliente: Cliente = { id: '1', nome: 'Acme Corp', contato: 'acme@test.com', created_at: '' }
    render(<ClienteModal open={true} cliente={cliente} onClose={onClose} />)
    expect(screen.getByText('Editar Cliente')).toBeInTheDocument()
    expect(screen.getByLabelText(/nome/i)).toHaveValue('Acme Corp')
    expect(screen.getByLabelText(/contato/i)).toHaveValue('acme@test.com')
  })

  it('shows validation error when nome is empty', async () => {
    render(<ClienteModal open={true} cliente={null} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(<ClienteModal open={false} cliente={null} onClose={onClose} />)
    expect(screen.queryByText('Novo Cliente')).not.toBeInTheDocument()
  })
})
