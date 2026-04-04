'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { fetchStats, fetchActivity, fetchCoverage } from '@/lib/dashboard'
import { StatCard } from '@/components/dashboard/stat-card'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import type { DashboardStats, ActivityItem, CoverageItem } from '@/lib/dashboard'

type QuickAction = { icon: string; title: string; desc: string; href: string }

type Props = {
  initialStats:    DashboardStats
  initialActivity: ActivityItem[]
  initialCoverage: CoverageItem[]
  quickActions:    QuickAction[]
}

export function DashboardClientWrapper({
  initialStats,
  initialActivity,
  initialCoverage,
  quickActions,
}: Props) {
  const [stats,    setStats]    = useState<DashboardStats>(initialStats)
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity)
  const [coverage, setCoverage] = useState<CoverageItem[]>(initialCoverage)

  const refetchAll = useCallback(async () => {
    const supabase = createClient()
    const [s, a, c] = await Promise.all([
      fetchStats(supabase),
      fetchActivity(supabase),
      fetchCoverage(supabase),
    ])
    setStats(s)
    setActivity(a)
    setCoverage(c)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const handler = () => { refetchAll() }

    supabase.channel('dashboard-projetos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projetos' }, handler)
      .subscribe()

    supabase.channel('dashboard-referencias')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referencias' }, handler)
      .subscribe()

    supabase.channel('dashboard-design-systems')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'design_systems' }, handler)
      .subscribe()

    supabase.channel('dashboard-paginas')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'paginas_geradas' }, handler)
      .subscribe()

    supabase.channel('dashboard-jobs')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs' }, handler)
      .subscribe()

    return () => {
      supabase.removeAllChannels()
    }
  }, [refetchAll])

  const deltaText = (n: number, singular: string, plural: string, empty: string) =>
    n === 0 ? empty : `${n} ${n === 1 ? singular : plural}`

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard
          label="projetos ativos"
          value={stats.projetos}
          delta={deltaText(stats.projetos, 'projeto', 'total', 'nenhum ainda')}
          color="amber"
        />
        <StatCard
          label="referências"
          value={stats.referencias}
          delta={deltaText(stats.referencias, 'na biblioteca', 'na biblioteca', 'nenhuma ainda')}
          color="teal"
        />
        <StatCard
          label="design systems"
          value={stats.ds}
          delta={deltaText(stats.ds, 'extraído', 'extraídos', 'nenhum ainda')}
          color="purple"
        />
        <StatCard
          label="lps geradas"
          value={stats.paginas}
          delta={deltaText(stats.paginas, 'versão', 'versões', 'nenhuma ainda')}
          color="blue"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_320px] gap-4">
        <ActivityFeed items={activity} />

        <div className="flex flex-col gap-4">
          {/* Quick Actions */}
          <div className="bg-elevated border border-border-default rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border-default">
              <span className="font-syne text-[13px] font-bold tracking-tight text-text-1">Ações Rápidas</span>
            </div>
            <div className="p-3">
              {quickActions.map((action) => (
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
              {coverage.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[11px] text-text-2 font-mono">{item.label}</span>
                    <span className="text-[11px] font-mono" style={{ color: item.color }}>
                      {item.count} {item.count === 1 ? 'ref' : 'refs'}
                    </span>
                  </div>
                  <div className="h-[3px] bg-border-default rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%`, background: item.color }}
                    />
                  </div>
                </div>
              ))}
              {coverage.every(c => c.count === 0) && (
                <p className="text-[11px] text-text-3 font-mono mt-1">
                  Adicione referências para ver a cobertura
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
