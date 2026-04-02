'use client'

import type { Cliente } from '@/lib/types'

type ClienteWithCount = Cliente & { projeto_count: number }

type ClientesTableProps = {
  clientes: ClienteWithCount[]
  onEdit: (cliente: Cliente) => void
  onDelete: (cliente: Cliente) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function ClientesTable({ clientes, onEdit, onDelete }: ClientesTableProps) {
  if (clientes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="w-12 h-12 rounded-xl border border-border-default flex items-center justify-center"
          style={{ background: 'rgba(240,180,41,0.05)' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="4" width="14" height="2" rx="1" fill="#4A5568"/>
            <rect x="3" y="9" width="9" height="2" rx="1" fill="#4A5568"/>
            <rect x="3" y="14" width="11" height="2" rx="1" fill="#4A5568"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="font-syne font-bold text-[15px] text-text-2 mb-1">Nenhum cliente cadastrado</p>
          <p className="text-[12px] font-mono text-text-3">Adicione seu primeiro cliente pelo botão acima</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid #1E2B3C' }}>
            {['Nome', 'Contato', 'Projetos', 'Criado em', 'Ações'].map((col, i) => (
              <th
                key={col}
                className="text-left pb-3 font-mono text-[9px] uppercase tracking-[2.5px] text-text-3"
                style={{ paddingRight: i < 4 ? '24px' : '0' }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente, idx) => (
            <tr
              key={cliente.id}
              className="group transition-colors duration-150"
              style={{
                borderBottom: idx < clientes.length - 1 ? '1px solid rgba(30,43,60,0.6)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(19,26,36,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
            >
              <td className="py-3.5 pr-6">
                <span className="font-syne font-semibold text-[13px] text-text-1">{cliente.nome}</span>
              </td>
              <td className="py-3.5 pr-6">
                <span className="font-mono text-[12px] text-text-2">
                  {cliente.contato ?? <span className="text-text-3">—</span>}
                </span>
              </td>
              <td className="py-3.5 pr-6">
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg font-mono text-[11px] font-bold"
                  style={{
                    background: cliente.projeto_count > 0
                      ? 'rgba(240,180,41,0.10)'
                      : 'rgba(30,43,60,0.5)',
                    color: cliente.projeto_count > 0 ? '#F0B429' : '#4A5568',
                  }}
                >
                  {cliente.projeto_count}
                </span>
              </td>
              <td className="py-3.5 pr-6">
                <span className="font-mono text-[11px] text-text-3">{formatDate(cliente.created_at)}</span>
              </td>
              <td className="py-3.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(cliente)}
                    className="h-7 px-3 text-[11px] font-mono text-text-2 border border-border-default rounded-md hover:border-border-hi hover:text-text-1 transition-all duration-150"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(cliente)}
                    className="h-7 px-3 text-[11px] font-mono text-red-lp/70 border border-transparent rounded-md hover:border-red-lp/25 hover:text-red-lp transition-all duration-150"
                  >
                    Deletar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
