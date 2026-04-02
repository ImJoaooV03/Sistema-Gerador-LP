import { render, screen } from '@testing-library/react'
import { ActivityFeed } from '@/components/dashboard/activity-feed'

describe('ActivityFeed', () => {
  it('renders the section header', () => {
    render(<ActivityFeed />)
    expect(screen.getByText('Atividade Recente')).toBeInTheDocument()
  })

  it('renders mock activity items', () => {
    render(<ActivityFeed />)
    expect(screen.getByText(/Curso de Inglês/)).toBeInTheDocument()
    expect(screen.getByText(/Hotmart Dark/)).toBeInTheDocument()
  })
})
