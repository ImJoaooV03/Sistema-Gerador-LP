'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Drawer } from '@/components/shared/drawer'
import { NICHES, NICHE_KEYS, PAGE_TYPES } from '@/lib/constants/niches'
import type { Cliente, Projeto } from '@/lib/types'

type ProjetoDrawerProps = {
  open: boolean
  projeto: Projeto | null
  clientes: Cliente[]
  onClose: () => void
}

const inputClass =
  'w-full h-11 bg-elevated border border-border-default rounded-lg px-4 text-[13px] text-text-1 placeholder:text-text-3 font-mono outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(240,180,41,0.09)] disabled:opacity-40 disabled:cursor-not-allowed'

const labelClass = 'text-[9px] uppercase tracking-[2.5px] text-text-3 font-mono'

const selectArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234A5568' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`

export function ProjetoDrawer({ open, projeto, clientes, onClose }: ProjetoDrawerProps) {
  const [nome,      setNome]      = useState('')
  const [clienteId, setClienteId] = useState('')
  const [niche,     setNiche]     = useState('')
  const [subNiche,  setSubNiche]  = useState('')
  const [pageType,  setPageType]  = useState('')
  const [briefing,  setBriefing]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (projeto) {
      setNome(projeto.nome)
      setClienteId(projeto.cliente_id)
      setNiche(projeto.niche)
      setSubNiche(projeto.sub_niche)
      setPageType(projeto.page_type)
      setBriefing(projeto.briefing ?? '')
    } else {
      setNome('')
      setClienteId('')
      setNiche('')
      setSubNiche('')
      setPageType('')
      setBriefing('')
    }
    setError(null)
  }, [projeto, open])

  function handleNicheChange(value: string) {
    setNiche(value)
    setSubNiche('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome é obrigatório'); return }
    if (!clienteId)   { setError('Selecione um cliente'); return }
    if (!niche)       { setError('Selecione um niche'); return }
    if (!subNiche)    { setError('Selecione um sub-niche'); return }
    if (!pageType)    { setError('Selecione um tipo de página'); return }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const payload = {
      nome:       nome.trim(),
      cliente_id: clienteId,
      niche,
      sub_niche:  subNiche,
      page_type:  pageType,
      briefing:   briefing.trim() || null,
    }

    const { error: err } = projeto
      ? await supabase.from('projetos').update(payload).eq('id', projeto.id)
      : await supabase.from('projetos').insert({ ...payload, status: 'rascunho' })

    if (err) { setError(err.message); setLoading(false); return }

    router.refresh()
    onClose()
    setLoading(false)
  }

  const subNiches = niche ? (NICHES[niche] ?? []) : []

  return (
    <Drawer open={open} onClose={onClose} width="480px">
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-5"
        style={{ borderBottom: '1px solid #1E2B3C' }}
      >
        <div>
          <h2 className="font-syne font-bold text-[16px] text-text-1">
            {projeto ? 'Editar Projeto' : 'Novo Projeto'}
          </h2>
          <p className="font-mono text-[10px] text-text-3 mt-0.5 uppercase tracking-[1.5px]">
            {projeto ? 'Atualize os dados' : 'Configure a nova LP'}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Fechar drawer"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-default text-text-3 hover:border-border-hi hover:text-text-1 transition-all text-[13px]"
        >
          ✕
        </button>
      </div>

      {/* Body (scrollable) */}
      <form
        id="projeto-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5"
      >
        {/* Nome */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="projeto-nome" className={labelClass}>
            Nome do projeto <span className="text-accent">*</span>
          </label>
          <input
            id="projeto-nome"
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: LP Curso de Inglês"
            className={inputClass}
          />
        </div>

        {/* Cliente */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="projeto-cliente" className={labelClass}>
            Cliente <span className="text-accent">*</span>
          </label>
          <select
            id="projeto-cliente"
            value={clienteId}
            onChange={e => setClienteId(e.target.value)}
            className={inputClass}
            style={{
              appearance: 'none',
              backgroundImage: selectArrow,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
            }}
          >
            <option value="">Selecione um cliente</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        {/* Segmentação divider */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1 h-px" style={{ background: 'rgba(30,43,60,0.6)' }} />
          <span className="font-mono text-[9px] uppercase tracking-[2px] text-text-3 flex-shrink-0">Segmentação</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(30,43,60,0.6)' }} />
        </div>

        {/* Niche */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} id="niche-label">
            Niche <span className="text-accent">*</span>
          </label>
          <select
            aria-label="Niche"
            value={niche}
            onChange={e => handleNicheChange(e.target.value)}
            className={inputClass}
            style={{
              appearance: 'none',
              backgroundImage: selectArrow,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
            }}
          >
            <option value="">Selecione um niche</option>
            {NICHE_KEYS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Sub-niche */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} id="subniche-label">
            Sub-niche <span className="text-accent">*</span>
          </label>
          <select
            aria-label="Sub-niche"
            value={subNiche}
            onChange={e => setSubNiche(e.target.value)}
            disabled={!niche}
            className={inputClass}
            style={{
              appearance: 'none',
              backgroundImage: selectArrow,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
            }}
          >
            <option value="">
              {niche ? 'Selecione o sub-niche' : 'Selecione um niche primeiro'}
            </option>
            {subNiches.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Page type */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} id="pagetype-label">
            Tipo de página <span className="text-accent">*</span>
          </label>
          <select
            aria-label="Page type"
            value={pageType}
            onChange={e => setPageType(e.target.value)}
            className={inputClass}
            style={{
              appearance: 'none',
              backgroundImage: selectArrow,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
            }}
          >
            <option value="">Selecione o tipo</option>
            {PAGE_TYPES.map(pt => (
              <option key={pt} value={pt}>{pt}</option>
            ))}
          </select>
        </div>

        {/* Briefing divider */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex-1 h-px" style={{ background: 'rgba(30,43,60,0.6)' }} />
          <span className="font-mono text-[9px] uppercase tracking-[2px] text-text-3 flex-shrink-0">Briefing</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(30,43,60,0.6)' }} />
        </div>

        {/* Briefing textarea */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="projeto-briefing" className={labelClass}>
            Briefing{' '}
            <span className="text-text-3 normal-case tracking-normal font-sans text-[10px]">(opcional)</span>
          </label>
          <textarea
            id="projeto-briefing"
            value={briefing}
            onChange={e => setBriefing(e.target.value)}
            rows={5}
            placeholder="Descreva o produto, público, diferenciais..."
            className="w-full bg-elevated border border-border-default rounded-lg px-4 py-3 text-[13px] text-text-1 placeholder:text-text-3 font-mono outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(240,180,41,0.09)] resize-none leading-relaxed"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-red-lp/25 bg-red-lp/5">
            <span className="text-red-lp text-[11px]">✕</span>
            <span className="text-red-lp text-[12px] font-mono">{error}</span>
          </div>
        )}
      </form>

      {/* Footer */}
      <div
        className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4"
        style={{ borderTop: '1px solid #1E2B3C' }}
      >
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
          form="projeto-form"
          disabled={loading}
          className="h-10 px-5 bg-accent text-bg-base font-syne font-bold text-[13px] tracking-tight rounded-lg hover:brightness-110 hover:shadow-accent-glow transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-[12px] h-[12px] border-2 border-bg-base/25 border-t-bg-base rounded-full animate-spin" />
              {projeto ? 'Salvando...' : 'Criando...'}
            </span>
          ) : (
            projeto ? 'Salvar' : 'Criar Projeto'
          )}
        </button>
      </div>
    </Drawer>
  )
}
