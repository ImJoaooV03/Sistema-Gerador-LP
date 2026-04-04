import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

import { PromptsForm } from '@/components/configuracoes/prompts-form'
import { DEFAULT_PROMPT_DS } from '@/lib/defaults'

describe('PromptsForm', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
  })

  it('renders textareas with current prompt values', () => {
    render(<PromptsForm promptDs="prompt ds customizado" promptLp="prompt lp customizado" />)
    const textareas = screen.getAllByRole('textbox')
    expect(textareas[0]).toHaveValue('prompt ds customizado')
    expect(textareas[1]).toHaveValue('prompt lp customizado')
  })

  it('shows token count based on text length', () => {
    render(<PromptsForm promptDs="aaaa" promptLp="" />)
    expect(screen.getByText(/1 tokens/i)).toBeInTheDocument()
  })

  it('restaurar padrao button fills textarea with DEFAULT_PROMPT_DS', () => {
    render(<PromptsForm promptDs="customizado" promptLp="" />)
    const restoreButtons = screen.getAllByRole('button', { name: /restaurar padrão/i })
    fireEvent.click(restoreButtons[0])
    const textareas = screen.getAllByRole('textbox')
    expect(textareas[0]).toHaveValue(DEFAULT_PROMPT_DS)
  })

  it('submits prompt_ds individually', async () => {
    render(<PromptsForm promptDs="meu prompt ds" promptLp="" />)
    const saveButtons = screen.getAllByRole('button', { name: /salvar prompt/i })
    fireEvent.click(saveButtons[0])
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/configuracoes', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ prompt_ds: 'meu prompt ds' }),
      }))
    })
  })

  it('submits prompt_lp individually', async () => {
    render(<PromptsForm promptDs="" promptLp="meu prompt lp" />)
    const saveButtons = screen.getAllByRole('button', { name: /salvar prompt/i })
    fireEvent.click(saveButtons[1])
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/configuracoes', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ prompt_lp: 'meu prompt lp' }),
      }))
    })
  })
})
