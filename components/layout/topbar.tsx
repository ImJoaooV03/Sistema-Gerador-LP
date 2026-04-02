'use client'

import { usePathname } from 'next/navigation'

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  '/dashboard':      { title: 'Dashboard',      crumb: 'visão geral'       },
  '/projetos':       { title: 'Projetos',        crumb: 'lista'             },
  '/clientes':       { title: 'Clientes',        crumb: 'gestão'            },
  '/referencias':    { title: 'Referências',     crumb: 'biblioteca'        },
  '/design-systems': { title: 'Design Systems',  crumb: 'biblioteca'        },
  '/gerador':        { title: 'Gerador LP',       crumb: 'nova landing page' },
  '/configuracoes':  { title: 'Configurações',   crumb: 'sistema'           },
}

function getPageMeta(pathname: string) {
  const match = Object.keys(PAGE_META)
    .sort((a, b) => b.length - a.length)
    .find(key => pathname.startsWith(key))
  return match ? PAGE_META[match] : { title: 'Sistema LP', crumb: '' }
}

export function Topbar() {
  const pathname = usePathname()
  const { title, crumb } = getPageMeta(pathname)

  return (
    <header className="h-[77px] flex-shrink-0 bg-surface border-b border-border-default flex items-center px-7 gap-4">
      <span className="font-syne text-[15px] font-bold tracking-tight text-text-1">
        {title}
      </span>
      <div className="w-px h-3.5 bg-border-default" />
      <span className="text-[11px] text-text-3 font-mono">{crumb}</span>
      {/* Portal target: page-level action buttons are injected here by child layouts */}
      <div id="topbar-actions" className="ml-auto flex items-center gap-2" />
    </header>
  )
}
