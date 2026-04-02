import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { signOut: vi.fn() },
  })),
}))

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

describe('Sidebar', () => {
  it('renders all navigation items', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Projetos')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Referências')).toBeInTheDocument()
    expect(screen.getByText('Design Systems')).toBeInTheDocument()
    expect(screen.getByText('Gerador LP')).toBeInTheDocument()
    expect(screen.getByText('Configurações')).toBeInTheDocument()
  })

  it('marks the current route as active', () => {
    vi.mocked(usePathname).mockReturnValue('/referencias')
    render(<Sidebar />)

    const refLink = screen.getByText('Referências').closest('a')
    expect(refLink).toHaveClass('bg-accent-dim')
  })

  it('does not mark other routes as active', () => {
    vi.mocked(usePathname).mockReturnValue('/referencias')
    render(<Sidebar />)

    const dashLink = screen.getByText('Dashboard').closest('a')
    expect(dashLink).not.toHaveClass('bg-accent-dim')
  })
})
