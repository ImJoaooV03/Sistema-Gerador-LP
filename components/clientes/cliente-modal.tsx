'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/shared/modal'
import type { Cliente } from '@/lib/types'

type ClienteModalProps = {
  open: boolean
  cliente: Cliente | null
  onClose: () => void
}

export function ClienteModal({ open, cliente, onClose }: ClienteModalProps) {
  const [nome, setNome]       = useState('')
  const [contato, setContato] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setNome(cliente?.nome ?? '')
    setContato(cliente?.contato ?? '')
    setError(null)
  }, [cliente, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome é obrigatório'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const payload = { nome: nome.trim(), contato: contato.trim() || null }
    const { error: err } = cliente
      ? await supabase.from('clientes').update(payload).eq('id', cliente.id)
      : await supabase.from('clientes').insert(payload)
    if (err) { setError(err.message); setLoading(false); return }
    router.refresh()
    onClose()
    setLoading(false)
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-[420px] mx-4">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border-default">
        <div>
          <h2 className="font-syne font-bold text-[16px] text-text-1">
            {cliente ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <p className="text-[11px] font-mono text-text-3 mt-0.5">
            {cliente ? 'Atualize os dados do cliente' : 'Preencha os dados para cadastrar'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border-default text-text-3 hover:border-border-hi hover:text-text-1 transition-all text-[14px] leading-none"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
        {/* Nome */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nome" className="text-[9px] uppercase tracking-[2.5px] text-text-3 font-mono">
            Nome <span className="text-accent">*</span>
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: Acme Corp"
            className="w-full h-11 bg-elevated border border-border-default rounded-lg px-4 text-[13px] text-text-1 placeholder:text-text-3 font-mono outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(240,180,41,0.09)]"
          />
        </div>

        {/* Contato */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contato" className="text-[9px] uppercase tracking-[2.5px] text-text-3 font-mono">
            Contato
          </label>
          <input
            id="contato"
            type="text"
            value={contato}
            onChange={e => setContato(e.target.value)}
            placeholder="email ou telefone"
            className="w-full h-11 bg-elevated border border-border-default rounded-lg px-4 text-[13px] text-text-1 placeholder:text-text-3 font-mono outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(240,180,41,0.09)]"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-red-lp/25 bg-red-lp/5">
            <span className="text-red-lp text-[11px]">✕</span>
            <span className="text-red-lp text-[12px] font-mono">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 px-5 text-[13px] font-medium text-text-2 border border-border-default rounded-lg hover:border-border-hi hover:text-text-1 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-10 px-5 bg-accent text-bg-base font-syne font-bold text-[13px] tracking-tight rounded-lg hover:brightness-110 hover:shadow-accent-glow transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-[12px] h-[12px] border-2 border-bg-base/25 border-t-bg-base rounded-full animate-spin" />
                Salvando...
              </span>
            ) : (
              'Salvar'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
