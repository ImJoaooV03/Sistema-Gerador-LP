'use client'

import { useState, useRef } from 'react'
import { Drawer } from '@/components/shared/drawer'
import { NICHES, NICHE_KEYS, PAGE_TYPES } from '@/lib/constants/niches'
import type { Referencia } from '@/lib/types'

type ReferenciaUploadDrawerProps = {
  open: boolean
  onClose: () => void
  onUploaded: (ref: Referencia) => void
}

const inputClass =
  'w-full h-11 bg-elevated border border-border-default rounded-lg px-4 text-[13px] text-text-1 placeholder:text-text-3 font-mono outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(240,180,41,0.09)] disabled:opacity-40 disabled:cursor-not-allowed'

const labelClass = 'text-[9px] uppercase tracking-[2.5px] text-text-3 font-mono'

const selectArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234A5568' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`

export function ReferenciaUploadDrawer({ open, onClose, onUploaded }: ReferenciaUploadDrawerProps) {
  const [nome,       setNome]       = useState('')
  const [file,       setFile]       = useState<File | null>(null)
  const [niche,      setNiche]      = useState('')
  const [subNiche,   setSubNiche]   = useState('')
  const [pageType,   setPageType]   = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [dragOver,   setDragOver]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setNome(''); setFile(null); setNiche(''); setSubNiche('')
    setPageType(''); setObservacoes(''); setLoading(false); setError(null); setDragOver(false)
  }

  function handleClose() { reset(); onClose() }

  function handleNicheChange(value: string) {
    setNiche(value)
    setSubNiche('')
  }

  function handleFile(f: File) { setFile(f); setError(null) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome é obrigatório'); return }
    if (!file)        { setError('Selecione um arquivo ZIP'); return }
    if (!niche)       { setError('Selecione um niche'); return }
    if (!subNiche)    { setError('Selecione um sub-niche'); return }
    if (!pageType)    { setError('Selecione um tipo de página'); return }

    setLoading(true); setError(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('nome', nome.trim())
    fd.append('niche', niche)
    fd.append('sub_niche', subNiche)
    fd.append('page_type', pageType)
    if (observacoes.trim()) fd.append('observacoes', observacoes.trim())

    try {
      const res = await fetch('/referencias/api/upload-referencia', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao enviar'); setLoading(false); return }

      onUploaded({
        id: json.id,
        design_system_id: null,
        nome: nome.trim(),
        niche,
        sub_niche: subNiche,
        page_type: pageType,
        tags: [],
        observacoes: observacoes.trim() || null,
        storage_path: `${json.id}.zip`,
        created_at: new Date().toISOString(),
      })
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
      setLoading(false)
    }
  }

  const subNiches = niche ? (NICHES[niche] ?? []) : []

  if (!open) return null

  return (
    <Drawer open={open} onClose={handleClose} width="480px">
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-5"
        style={{ borderBottom: '1px solid #1E2B3C' }}
      >
        <div>
          <h2 className="font-syne font-bold text-[16px] text-text-1">Nova Referência</h2>
          <p className="font-mono text-[10px] text-text-3 mt-0.5 uppercase tracking-[1.5px]">
            Upload de LP para a biblioteca
          </p>
        </div>
        <button
          onClick={handleClose}
          aria-label="Fechar drawer"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-default text-text-3 hover:border-border-hi hover:text-text-1 transition-all text-[13px]"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <form
        id="ref-upload-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5"
      >
        {/* Nome */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ref-nome" className={labelClass}>
            Nome <span className="text-accent">*</span>
          </label>
          <input
            id="ref-nome"
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: LP Curso de Inglês"
            className={inputClass}
            disabled={loading}
          />
        </div>

        {/* Drag & drop */}
        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>
            Arquivo ZIP <span className="text-accent">*</span>
          </span>
          <div
            className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 cursor-pointer transition-all duration-200"
            style={{
              borderColor: dragOver ? '#F0B429' : '#1E2B3C',
              background: dragOver ? 'rgba(240,180,41,0.04)' : 'rgba(19,26,36,0.5)',
            }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onClick={() => !loading && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              disabled={loading}
            />
            <div className="text-[18px] opacity-50">⬆</div>
            {file ? (
              <p className="font-mono text-[12px] text-accent">{file.name}</p>
            ) : (
              <p className="font-mono text-[11px] text-text-3 text-center">
                Arraste o ZIP aqui ou clique para selecionar
              </p>
            )}
          </div>
        </div>

        {/* Segmentação divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(30,43,60,0.6)' }} />
          <span className="font-mono text-[9px] uppercase tracking-[2px] text-text-3 flex-shrink-0">Segmentação</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(30,43,60,0.6)' }} />
        </div>

        {/* Niche */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} id="ref-niche-label">
            Niche <span className="text-accent">*</span>
          </label>
          <select
            aria-label="Niche"
            value={niche}
            onChange={e => handleNicheChange(e.target.value)}
            disabled={loading}
            className={inputClass}
            style={{ appearance: 'none', backgroundImage: selectArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
          >
            <option value="">Selecione um niche</option>
            {NICHE_KEYS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Sub-niche */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            Sub-niche <span className="text-accent">*</span>
          </label>
          <select
            aria-label="Sub-niche"
            value={subNiche}
            onChange={e => setSubNiche(e.target.value)}
            disabled={loading || !niche}
            className={inputClass}
            style={{ appearance: 'none', backgroundImage: selectArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
          >
            <option value="">{niche ? 'Selecione o sub-niche' : 'Selecione um niche primeiro'}</option>
            {subNiches.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Page type */}
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            Tipo de página <span className="text-accent">*</span>
          </label>
          <select
            aria-label="Page type"
            value={pageType}
            onChange={e => setPageType(e.target.value)}
            disabled={loading}
            className={inputClass}
            style={{ appearance: 'none', backgroundImage: selectArrow, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
          >
            <option value="">Selecione o tipo</option>
            {PAGE_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
          </select>
        </div>

        {/* Observações */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ref-obs" className={labelClass}>
            Observações{' '}
            <span className="text-text-3 normal-case tracking-normal font-sans text-[10px]">(opcional)</span>
          </label>
          <textarea
            id="ref-obs"
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            rows={3}
            disabled={loading}
            placeholder="Notas sobre esta referência..."
            className="w-full bg-elevated border border-border-default rounded-lg px-4 py-3 text-[13px] text-text-1 placeholder:text-text-3 font-mono outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(240,180,41,0.09)] resize-none disabled:opacity-40"
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
          onClick={handleClose}
          disabled={loading}
          className="h-10 px-5 text-[13px] font-medium text-text-2 border border-border-default rounded-lg hover:border-border-hi hover:text-text-1 transition-all disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="ref-upload-form"
          disabled={loading}
          className="h-10 px-5 bg-accent text-bg-base font-syne font-bold text-[13px] tracking-tight rounded-lg hover:brightness-110 hover:shadow-accent-glow transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-[12px] h-[12px] border-2 border-bg-base/25 border-t-bg-base rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            'Enviar Referência'
          )}
        </button>
      </div>
    </Drawer>
  )
}
