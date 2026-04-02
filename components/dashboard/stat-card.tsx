import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: string | number
  delta: string
  color: 'amber' | 'teal' | 'purple' | 'blue'
}

const colorMap = {
  amber:  { value: 'text-accent',   glow: 'after:bg-accent'   },
  teal:   { value: 'text-teal',     glow: 'after:bg-teal'     },
  purple: { value: 'text-purple',   glow: 'after:bg-purple'   },
  blue:   { value: 'text-blue-lp',  glow: 'after:bg-blue-lp'  },
}

export function StatCard({ label, value, delta, color }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div
      className={cn(
        'bg-elevated border border-border-default rounded-xl p-5 relative overflow-hidden',
        'hover:border-border-hi hover:-translate-y-px transition-all duration-200 cursor-default',
        'after:content-[""] after:absolute after:-top-5 after:-right-5',
        'after:w-20 after:h-20 after:rounded-full after:opacity-[0.07]',
        c.glow
      )}
    >
      <div className="text-[10px] uppercase tracking-[1.2px] text-text-3 font-mono mb-2.5">
        {label}
      </div>
      <div className={cn('font-syne text-[34px] font-extrabold tracking-[-1.5px] leading-none mb-1.5', c.value)}>
        {value}
      </div>
      <div className="text-[11px] text-text-3">{delta}</div>
    </div>
  )
}
