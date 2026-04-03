import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { DsUploadModal } from '@/components/design-systems/ds-upload-modal'

describe('DsUploadModal', () => {
  it('renders when open', () => {
    render(<DsUploadModal open={true} onClose={vi.fn()} onUpload={vi.fn()} />)
    expect(screen.getByText('Novo Design System')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<DsUploadModal open={false} onClose={vi.fn()} onUpload={vi.fn()} />)
    expect(screen.queryByText('Novo Design System')).not.toBeInTheDocument()
  })

  it('shows validation error when nome is empty', async () => {
    render(<DsUploadModal open={true} onClose={vi.fn()} onUpload={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /extrair/i }))
    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument()
  })

  it('shows validation error when no file selected', async () => {
    render(<DsUploadModal open={true} onClose={vi.fn()} onUpload={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Meu DS' } })
    fireEvent.click(screen.getByRole('button', { name: /extrair/i }))
    expect(await screen.findByText(/selecione um arquivo/i)).toBeInTheDocument()
  })
})
