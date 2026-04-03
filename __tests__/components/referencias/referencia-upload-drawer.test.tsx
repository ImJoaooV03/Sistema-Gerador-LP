import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { ReferenciaUploadDrawer } from '@/components/referencias/referencia-upload-drawer'

describe('ReferenciaUploadDrawer', () => {
  it('renders when open', () => {
    render(<ReferenciaUploadDrawer open={true} onClose={vi.fn()} onUploaded={vi.fn()} />)
    expect(screen.getByText('Nova Referência')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<ReferenciaUploadDrawer open={false} onClose={vi.fn()} onUploaded={vi.fn()} />)
    expect(screen.queryByText('Nova Referência')).not.toBeInTheDocument()
  })

  it('resets sub-niche when niche changes', () => {
    render(<ReferenciaUploadDrawer open={true} onClose={vi.fn()} onUploaded={vi.fn()} />)
    fireEvent.change(screen.getByRole('combobox', { name: /^niche$/i }), { target: { value: 'SaaS' } })
    expect(screen.getByRole('option', { name: 'B2B' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Fitness' })).not.toBeInTheDocument()
  })

  it('shows error when nome is empty on submit', async () => {
    render(<ReferenciaUploadDrawer open={true} onClose={vi.fn()} onUploaded={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }))
    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument()
  })
})
