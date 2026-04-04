import { cn } from '@/lib/utils'
import type { ActivityItem } from '@/lib/dashboard'

type Props = { items: ActivityItem[] }

const dotClass: Record<ActivityItem['status'], string> = {
  success:    'bg-teal shadow-teal-glow',
  processing: 'bg-accent shadow-accent-glow animate-pulse',
  info:       'bg-blue-lp',
}

export function ActivityFeed({ items }: Props) {
  return (
    <div className="bg-elevated border border-border-default rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border-default flex items-center justify-between">
        <span className="font-syne text-[13px] font-bold tracking-tight text-text-1">Atividade Recente</span>
        <span className="text-[10px] text-text-3 font-mono">últimas ações</span>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-[12px] text-text-3 font-mono">nenhuma atividade registrada ainda</p>
        </div>
      ) : (
        <div className="px-5">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 py-3 border-b border-border-default last:border-0">
              <div className={cn('w-[7px] h-[7px] rounded-full mt-[5px] flex-shrink-0', dotClass[item.status])} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-text-1 truncate">{item.name}</div>
                <div className="text-[11px] text-text-3 font-mono">{item.detail}</div>
              </div>
              <div className="text-[10px] text-text-3 font-mono flex-shrink-0 mt-0.5">{item.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
