import { cn } from '@/lib/utils'

type ActivityItem = {
  id: string
  name: string
  detail: string
  time: string
  status: 'success' | 'processing' | 'info'
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', name: 'LP gerada — Curso de Inglês Online',     detail: 'infoproduto · curso online · GPT-4o',  time: '2h',   status: 'success'    },
  { id: '2', name: 'Extraindo Design System — Hotmart Dark', detail: 'processando · claude-opus-4',           time: '5min', status: 'processing' },
  { id: '3', name: 'Nova referência — Guru Dark',            detail: 'infoproduto · vendas · dark mode',      time: '3h',   status: 'info'       },
  { id: '4', name: 'LP gerada — Software de Gestão B2B',    detail: 'saas · b2b · claude-opus-4',            time: '5h',   status: 'success'    },
  { id: '5', name: 'LP gerada — Academia de Nutrição',      detail: 'saúde · fitness · GPT-4o',              time: '8h',   status: 'success'    },
]

const dotClass: Record<ActivityItem['status'], string> = {
  success:    'bg-teal shadow-teal-glow',
  processing: 'bg-accent shadow-accent-glow animate-pulse',
  info:       'bg-blue-lp',
}

export function ActivityFeed() {
  return (
    <div className="bg-elevated border border-border-default rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border-default flex items-center justify-between">
        <span className="font-syne text-[13px] font-bold tracking-tight text-text-1">Atividade Recente</span>
        <span className="text-[10px] text-text-3 font-mono">últimas 24h</span>
      </div>
      <div className="px-5">
        {MOCK_ACTIVITY.map((item) => (
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
    </div>
  )
}
