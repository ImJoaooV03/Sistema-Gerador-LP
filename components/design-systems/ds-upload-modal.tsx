'use client'

import { useState, useRef } from 'react'
import { Modal } from '@/components/shared/modal'

type DsUploadModalProps = {
  open: boolean
  onClose: () => void
  onUpload: (id: string, dsHtml: string) => void
}

const inputClass =
  'w-full h-11 bg-elevated border border-border-default rounded-lg px-4 text-[13px] text-text-1 placeholder:text-text-3 font-mono outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(240,180,41,0.09)]'

const labelClass = 'text-[9px] uppercase tracking-[2.5px] text-text-3 font-mono'

export function DsUploadModal({ open, onClose, onUpload }: DsUploadModalProps) {
  const [nome,     setNome]     = useState('')
  const [file,     setFile]     = useState<File | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [error,    setError]    = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setNome('')
    setFile(null)
    setLoading(false)
    setProgress(0)
    setError(null)
    setDragOver(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleFile(f: File) {
    setFile(f)
    setError(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome é obrigatório'); return }
    if (!file)        { setError('Selecione um arquivo ZIP'); return }

    setLoading(true)
    setError(null)
    setProgress(10)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('nome', nome.trim())

    try {
      setProgress(30)
      const res = await fetch('/design-systems/api/extract-ds', { method: 'POST', body: fd })
      setProgress(90)
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao extrair'); setLoading(false); setProgress(0); return }
      setProgress(100)
      onUpload(json.id, json.ds_html)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} className="max-w-[420px] mx-4">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-5"
        style={{ borderBottom: '1px solid #1E2B3C' }}
      >
        <div>
          <h2 className="font-syne font-bold text-[16px] text-text-1">Novo Design System</h2>
          <p className="font-mono text-[10px] text-text-3 mt-0.5 uppercase tracking-[1.5px]">
            Upload de ZIP para extração
          </p>
        </div>
        <button
          onClick={handleClose}
          aria-label="Fechar"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-default text-text-3 hover:border-border-hi hover:text-text-1 transition-all text-[13px]"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <form id="ds-upload-form" onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
        {/* Nome */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ds-nome" className={labelClass}>
            Nome <span className="text-accent">*</span>
          </label>
          <input
            id="ds-nome"
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: Design System Acme"
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
            className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 cursor-pointer transition-all duration-200"
            style={{
              borderColor: dragOver ? '#F0B429' : '#1E2B3C',
              background: dragOver ? 'rgba(240,180,41,0.04)' : 'rgba(19,26,36,0.5)',
            }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
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
            <div className="text-[20px] opacity-50">⬆</div>
            {file ? (
              <p className="font-mono text-[12px] text-accent text-center">{file.name}</p>
            ) : (
              <p className="font-mono text-[11px] text-text-3 text-center">
                Arraste o ZIP aqui ou clique para selecionar
              </p>
            )}
            <p className="font-mono text-[10px] text-text-3 opacity-50">Máx. 50MB</p>
          </div>
        </div>

        {/* Progress bar */}
        {loading && (
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(30,43,60,0.8)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: '#F0B429' }}
            />
          </div>
        )}

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
        className="flex items-center justify-end gap-3 px-6 py-4"
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
          form="ds-upload-form"
          disabled={loading}
          className="h-10 px-5 bg-accent text-bg-base font-syne font-bold text-[13px] tracking-tight rounded-lg hover:brightness-110 hover:shadow-accent-glow transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-[12px] h-[12px] border-2 border-bg-base/25 border-t-bg-base rounded-full animate-spin" />
              Extraindo...
            </span>
          ) : (
            'Extrair Design System'
          )}
        </button>
      </div>
    </Modal>
  )
}
