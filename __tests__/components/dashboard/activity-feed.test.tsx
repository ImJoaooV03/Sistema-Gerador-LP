import { render, screen } from '@testing-library/react'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import type { ActivityItem } from '@/lib/dashboard'

const MOCK_ITEMS: ActivityItem[] = [
  { id: '1', name: 'LP gerada — Curso de Inglês', detail: 'versão 1', time: '2h',   status: 'success'    },
  { id: '2', name: 'Extraindo DS — Hotmart Dark',  detail: 'processando...',         time: '5min', status: 'processing' },
  { id: '3', name: 'Nova referência — Guru Dark',  detail: 'Infoproduto · Vendas',  time: '3h',   status: 'info'       },
]

describe('ActivityFeed', () => {
  it('renders the section header', () => {
    render(<ActivityFeed items={[]} />)
    expect(screen.getByText('Atividade Recente')).toBeInTheDocument()
  })

  it('renders activity items from props', () => {
    render(<ActivityFeed items={MOCK_ITEMS} />)
    expect(screen.getByText('LP gerada — Curso de Inglês')).toBeInTheDocument()
    expect(screen.getByText('Extraindo DS — Hotmart Dark')).toBeInTheDocument()
    expect(screen.getByText('Nova referência — Guru Dark')).toBeInTheDocument()
  })

  it('renders empty state when items is empty', () => {
    render(<ActivityFeed items={[]} />)
    expect(screen.getByText(/nenhuma atividade/i)).toBeInTheDocument()
  })

  it('renders detail and time for each item', () => {
    render(<ActivityFeed items={[MOCK_ITEMS[0]]} />)
    expect(screen.getByText('versão 1')).toBeInTheDocument()
    expect(screen.getByText('2h')).toBeInTheDocument()
  })
})
