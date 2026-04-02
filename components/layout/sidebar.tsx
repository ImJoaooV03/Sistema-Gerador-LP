'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard',      icon: '⬡', label: 'Dashboard',      badge: null },
      { href: '/projetos',       icon: '◧', label: 'Projetos',        badge: '0'  },
      { href: '/clientes',       icon: '◎', label: 'Clientes',        badge: null },
    ],
  },
  {
    label: 'Biblioteca',
    items: [
      { href: '/referencias',    icon: '◈', label: 'Referências',     badge: '0'  },
      { href: '/design-systems', icon: '◉', label: 'Design Systems',  badge: '0'  },
    ],
  },
  {
    label: 'Ferramenta',
    items: [
      { href: '/gerador',        icon: '⚡', label: 'Gerador LP',      badge: null },
      { href: '/configuracoes',  icon: '◌', label: 'Configurações',   badge: null },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-sidebar flex-shrink-0 bg-surface border-r border-border-default flex flex-col h-full">
      {/* Logo */}
      <div className="px-[18px] pt-[22px] pb-[18px] border-b border-border-default flex items-center gap-3">
        <div className="w-9 h-9 rounded-[9px] bg-accent flex items-center justify-center font-syne font-extrabold text-[13px] text-bg-base shadow-accent-glow flex-shrink-0">
          LP
        </div>
        <div>
          <div className="font-syne text-[15px] font-bold tracking-tight text-text-1 leading-tight">
            Sistema LP
          </div>
          <div className="text-[10px] text-text-3 font-mono tracking-wide mt-0.5">
            v1.0 · equipe
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3.5 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="text-[9px] uppercase tracking-[1.8px] text-text-3 font-mono px-2.5 py-1 mt-3 first:mt-0 mb-0.5">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13px] transition-all duration-150 relative border',
                    isActive
                      ? 'bg-accent-dim text-accent border-accent/20 font-medium'
                      : 'text-text-2 border-transparent hover:bg-elevated hover:text-text-1'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-sm bg-accent" />
                  )}
                  <span className="w-[17px] text-center text-[13px] flex-shrink-0">
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== null && (
                    <span className="bg-overlay text-text-3 text-[10px] font-mono px-1.5 py-0.5 rounded-lg border border-border-default">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2.5 border-t border-border-default">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-elevated border border-border-default cursor-pointer hover:border-border-hi transition-colors">
          <div className="w-1.5 h-1.5 rounded-full bg-teal shadow-teal-glow flex-shrink-0" />
          <span className="text-text-2 font-mono text-[11px] flex-1">claude-opus-4</span>
          <button
            onClick={handleSignOut}
            className="text-text-3 text-[10px] hover:text-text-2 transition-colors"
            title="Sair"
            aria-label="Sair"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  )
}
