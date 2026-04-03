import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { NicheFilterBar } from '@/components/referencias/niche-filter-bar'

describe('NicheFilterBar', () => {
  it('renders Todos and all niches', () => {
    render(<NicheFilterBar active="todos" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Infoproduto' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'SaaS' })).toBeInTheDocument()
  })

  it('calls onChange with niche value when clicked', () => {
    const onChange = vi.fn()
    render(<NicheFilterBar active="todos" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Infoproduto' }))
    expect(onChange).toHaveBeenCalledWith('Infoproduto')
  })

  it('calls onChange with todos when Todos clicked', () => {
    const onChange = vi.fn()
    render(<NicheFilterBar active="Infoproduto" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Todos' }))
    expect(onChange).toHaveBeenCalledWith('todos')
  })
})
