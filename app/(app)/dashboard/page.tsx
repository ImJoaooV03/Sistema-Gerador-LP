import { createClient } from '@/lib/supabase/server'
import { fetchStats, fetchActivity, fetchCoverage } from '@/lib/dashboard'
import { DashboardClientWrapper } from './client-wrapper'

const QUICK_ACTIONS = [
  { icon: '⚡', title: 'Gerar Nova LP',         desc: 'a partir de briefing', href: '/gerador'        },
  { icon: '📦', title: 'Adicionar Referência',  desc: 'upload de ZIP',        href: '/referencias'    },
  { icon: '🎨', title: 'Extrair Design System', desc: 'de página existente',  href: '/design-systems' },
]

export default async function DashboardPage() {
  const supabase = await createClient()

  const [stats, activity, coverage] = await Promise.all([
    fetchStats(supabase),
    fetchActivity(supabase),
    fetchCoverage(supabase),
  ])

  return (
    <DashboardClientWrapper
      initialStats={stats}
      initialActivity={activity}
      initialCoverage={coverage}
      quickActions={QUICK_ACTIONS}
    />
  )
}
