import { render, screen } from '@testing-library/react'
import { StatCard } from '@/components/dashboard/stat-card'

describe('StatCard', () => {
  it('renders label, value and delta', () => {
    render(<StatCard label="projetos ativos" value={12} delta="2 novos" color="amber" />)
    expect(screen.getByText('projetos ativos')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('2 novos')).toBeInTheDocument()
  })

  it('renders string value', () => {
    render(<StatCard label="lps geradas" value="48" delta="total" color="teal" />)
    expect(screen.getByText('48')).toBeInTheDocument()
  })
})
