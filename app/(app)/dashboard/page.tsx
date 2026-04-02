import Link from 'next/link'
import { StatCard } from '@/components/dashboard/stat-card'
import { ActivityFeed } from '@/components/dashboard/activity-feed'

const QUICK_ACTIONS = [
  { icon: '⚡', title: 'Gerar Nova LP',         desc: 'a partir de briefing', href: '/gerador'        },
  { icon: '📦', title: 'Adicionar Referência',  desc: 'upload de ZIP',        href: '/referencias'    },
  { icon: '🎨', title: 'Extrair Design System', desc: 'de página existente',  href: '/design-systems' },
]

// Colors mirror design tokens (--color-accent, --color-teal, etc.) — inline hex
// required here because dynamic Tailwind class interpolation would be purged at build time.
const LIBRARY_COVERAGE = [
  { label: 'Infoproduto', count: 0, pct: 0, color: '#F0B429' },
  { label: 'SaaS',        count: 0, pct: 0, color: '#00D4AA' },
  { label: 'E-commerce',  count: 0, pct: 0, color: '#A78BFA' },
  { label: 'Saúde',       count: 0, pct: 0, color: '#60A5FA' },
]

export default function DashboardPage() {
  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="projetos ativos" value={0} delta="nenhum ainda"  color="amber"  />
        <StatCard label="referências"     value={0} delta="nenhuma ainda" color="teal"   />
        <StatCard label="design systems"  value={0} delta="nenhum ainda"  color="purple" />
        <StatCard label="lps geradas"     value={0} delta="nenhuma ainda" color="blue"   />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_320px] gap-4">
        <ActivityFeed />

        <div className="flex flex-col gap-4">
          {/* Quick Actions */}
          <div className="bg-elevated border border-border-default rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border-default">
              <span className="font-syne text-[13px] font-bold tracking-tight text-text-1">Ações Rápidas</span>
            </div>
            <div className="p-3">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border-default bg-surface mb-2 last:mb-0 hover:border-accent/35 hover:bg-accent-dim transition-all duration-150 group"
                >
                  <span className="text-[17px] flex-shrink-0">{action.icon}</span>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-text-1">{action.title}</div>
                    <div className="text-[11px] text-text-3">{action.desc}</div>
                  </div>
                  <span className="text-text-3 text-[11px] group-hover:text-accent transition-colors">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Library Coverage */}
          <div className="bg-elevated border border-border-default rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border-default">
              <span className="font-syne text-[13px] font-bold tracking-tight text-text-1">Cobertura da Biblioteca</span>
            </div>
            <div className="px-4 py-4 flex flex-col gap-3">
              {LIBRARY_COVERAGE.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[11px] text-text-2 font-mono">{item.label}</span>
                    <span className="text-[11px] font-mono" style={{ color: item.color }}>{item.count} refs</span>
                  </div>
                  <div className="h-[3px] bg-border-default rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%`, background: item.color }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-text-3 font-mono mt-1">
                Adicione referências para ver a cobertura
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
