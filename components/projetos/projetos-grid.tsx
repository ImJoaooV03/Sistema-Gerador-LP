import { ProjetoCard } from './projeto-card'
import type { Projeto } from '@/lib/types'

type ProjetoWithCliente = Projeto & { cliente_nome: string }

type ProjetosGridProps = {
  projetos: ProjetoWithCliente[]
  onEdit: (projeto: Projeto) => void
  onDelete: (projeto: Projeto) => void
  onNew: () => void
}

export function ProjetosGrid({ projetos, onEdit, onDelete, onNew }: ProjetosGridProps) {
  if (projetos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div
          className="w-14 h-14 rounded-xl border border-border-default flex items-center justify-center text-[22px] text-text-3"
          style={{ background: 'rgba(240,180,41,0.04)' }}
        >
          ◧
        </div>
        <div className="text-center">
          <p className="font-syne font-bold text-[16px] text-text-2 mb-1.5">Nenhum projeto ainda</p>
          <p className="font-mono text-[12px] text-text-3 max-w-[240px] leading-relaxed">
            Crie seu primeiro projeto e comece a gerar landing pages com IA
          </p>
        </div>
        <button
          onClick={onNew}
          className="h-9 px-5 bg-accent text-bg-base font-syne font-bold text-[12px] tracking-tight rounded-lg hover:brightness-110 hover:shadow-accent-glow transition-all active:scale-[0.98]"
        >
          + Novo Projeto
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {projetos.map(p => (
        <ProjetoCard
          key={p.id}
          projeto={p}
          clienteNome={p.cliente_nome}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
