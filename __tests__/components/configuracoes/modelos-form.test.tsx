import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

import { ModelosForm } from '@/components/configuracoes/modelos-form'

describe('ModelosForm', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
  })

  it('renders both selects with current values', () => {
    render(<ModelosForm modeloDs="claude-sonnet-4-6" modeloLp="claude-opus-4-6" />)
    const selects = screen.getAllByRole('combobox')
    expect(selects).toHaveLength(2)
    expect(selects[0]).toHaveValue('claude-sonnet-4-6')
    expect(selects[1]).toHaveValue('claude-opus-4-6')
  })

  it('has all three model options in each select', () => {
    render(<ModelosForm modeloDs="claude-sonnet-4-6" modeloLp="claude-opus-4-6" />)
    const options = screen.getAllByRole('option', { name: /claude-opus-4-6/i })
    expect(options.length).toBeGreaterThanOrEqual(2)
  })

  it('submits both modelo values on save', async () => {
    render(<ModelosForm modeloDs="claude-sonnet-4-6" modeloLp="claude-opus-4-6" />)
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'claude-haiku-4-5-20251001' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar modelos/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/configuracoes', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ modelo_ds: 'claude-haiku-4-5-20251001', modelo_lp: 'claude-opus-4-6' }),
      }))
    })
  })
})
