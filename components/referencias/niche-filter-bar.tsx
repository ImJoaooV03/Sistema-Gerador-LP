'use client'

import { cn } from '@/lib/utils'
import { NICHE_KEYS } from '@/lib/constants/niches'

type NicheFilterBarProps = {
  active: string
  onChange: (niche: string) => void
}

const ALL_PILLS = ['todos', ...NICHE_KEYS] as string[]

export function NicheFilterBar({ active, onChange }: NicheFilterBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ALL_PILLS.map(pill => {
        const isActive = pill === active
        const label = pill === 'todos' ? 'Todos' : pill
        return (
          <button
            key={pill}
            type="button"
            onClick={() => onChange(pill)}
            className={cn(
              'h-7 px-3 rounded-full font-mono text-[11px] transition-all duration-150',
              isActive
                ? 'bg-accent text-bg-base'
                : 'border border-border-default text-text-2 hover:border-border-hi hover:text-text-1'
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
