import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}))

import { ApiKeysForm } from '@/components/configuracoes/api-keys-form'

describe('ApiKeysForm', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
  })

  it('shows teal badge when key is set', () => {
    render(<ApiKeysForm anthropicKeySet={true} openaiKeySet={false} />)
    expect(screen.getByText(/configurada/i)).toBeInTheDocument()
    expect(screen.getByText(/não configurada/i)).toBeInTheDocument()
  })

  it('shows gray badge when key is not set', () => {
    render(<ApiKeysForm anthropicKeySet={false} openaiKeySet={false} />)
    expect(screen.getAllByText(/não configurada/i)).toHaveLength(2)
  })

  it('toggles password visibility when eye button is clicked', () => {
    render(<ApiKeysForm anthropicKeySet={false} openaiKeySet={false} />)
    const inputs = screen.getAllByPlaceholderText(/sk-/i)
    expect(inputs[0]).toHaveAttribute('type', 'password')
    const toggles = screen.getAllByLabelText(/mostrar/i)
    fireEvent.click(toggles[0])
    expect(inputs[0]).toHaveAttribute('type', 'text')
  })

  it('submits anthropic key and calls POST /api/configuracoes', async () => {
    render(<ApiKeysForm anthropicKeySet={false} openaiKeySet={false} />)
    const inputs = screen.getAllByPlaceholderText(/sk-/i)
    fireEvent.change(inputs[0], { target: { value: 'sk-ant-test123' } })
    const buttons = screen.getAllByRole('button', { name: /key/i })
    fireEvent.click(buttons[0])
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/configuracoes', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ anthropic_key: 'sk-ant-test123' }),
      }))
    })
  })

  it('does not submit when input is empty', async () => {
    render(<ApiKeysForm anthropicKeySet={false} openaiKeySet={false} />)
    const buttons = screen.getAllByRole('button', { name: /key/i })
    fireEvent.click(buttons[0])
    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})
