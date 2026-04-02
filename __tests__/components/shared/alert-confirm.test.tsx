import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { AlertConfirm } from '@/components/shared/alert-confirm'

describe('AlertConfirm', () => {
  it('renders title and description when open', () => {
    render(
      <AlertConfirm
        open={true}
        title="Deletar cliente?"
        description="Esta ação não pode ser desfeita."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText('Deletar cliente?')).toBeInTheDocument()
    expect(screen.getByText('Esta ação não pode ser desfeita.')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <AlertConfirm
        open={false}
        title="Deletar?"
        description="Confirma?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.queryByText('Deletar?')).not.toBeInTheDocument()
  })

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn()
    render(
      <AlertConfirm
        open={true}
        title="Deletar?"
        description="Confirma?"
        confirmLabel="Deletar"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Deletar' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn()
    render(
      <AlertConfirm
        open={true}
        title="Deletar?"
        description="Confirma?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
