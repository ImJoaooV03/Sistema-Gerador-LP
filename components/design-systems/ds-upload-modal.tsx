'use client'

import { useState, useRef } from 'react'
import { Modal } from '@/components/shared/modal'

type DsUploadModalProps = {
  open: boolean
  onClose: () => void
  onUpload: (id: string, dsHtml: string) => void
}

type Step = 'form' | 'success'

const inputClass =
  'w-full h-11 bg-elevated border border-border-default rounded-lg px-4 text-[13px] text-text-1 placeholder:text-text-3 font-mono outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(240,180,41,0.09)]'

const labelClass = 'text-[9px] uppercase tracking-[2.5px] text-text-3 font-mono'

export function DsUploadModal({ open, onClose, onUpload }: DsUploadModalProps) {
  const [step,     setStep]     = useState<Step>('form')
  const [nome,     setNome]     = useState('')
  const [file,     setFile]     = useState<File | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [error,    setError]    = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [resultId,   setResultId]   = useState('')
  const [resultHtml, setResultHtml] = useState('')
  const [resultNome, setResultNome] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep('form')
    setNome('')
    setFile(null)
    setLoading(false)
    setProgress(0)
    setError(null)
    setDragOver(false)
    setResultId('')
    setResultHtml('')
    setResultNome('')
  }

  function handleClose() {
    if (step === 'success') {
      onUpload(resultId, resultHtml)
    }
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

  function downloadHtml() {
    if (!resultHtml) return
    const blob = new Blob([resultHtml], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${resultNome.replace(/\s+/g, '-').toLowerCase()}-design-system.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadBundle() {
    if (!resultId) return
    const res = await fetch(`/api/design-systems/${resultId}/bundle`)
    if (!res.ok) return
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${resultNome.replace(/\s+/g, '-').toLowerCase()}-bundle.zip`
    a.click()
    URL.revokeObjectURL(url)
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
      setResultId(json.id)
      setResultHtml(json.ds_html ?? '')
      setResultNome(nome.trim())
      setStep('success')
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
      setLoading(false)
      setProgress(0)
    }
  }

  // ── SUCCESS STEP ────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <Modal open={open} onClose={handleClose} className="w-[92vw] max-w-[1100px] mx-4 h-[88vh]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid #1E2B3C' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px]"
                style={{ background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.2)' }}
              >
                ✓
              </div>
              <div>
                <h2 className="font-syne font-bold text-[15px] text-text-1">{resultNome}</h2>
                <p className="font-mono text-[9px] text-[#00D4AA] uppercase tracking-[1.5px] mt-0.5">
                  Design system extraído com sucesso
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Fechar"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-default text-text-3 hover:border-border-hi hover:text-text-1 transition-all text-[13px]"
            >
              ✕
            </button>
          </div>

          {/* Preview iframe */}
          <div className="flex-1 overflow-hidden relative" style={{ minHeight: 0 }}>
            {resultHtml ? (
              <iframe
                srcDoc={resultHtml}
                title={`Design System — ${resultNome}`}
                className="w-full h-full border-0"
                style={{ background: '#020617' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-text-3 font-mono text-[12px]">
                Sem preview disponível
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-6 py-4"
            style={{ borderTop: '1px solid #1E2B3C' }}
          >
            <p className="font-mono text-[10px] text-text-3">
              O design system foi salvo e já aparece na lista.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={downloadHtml}
                className="h-9 px-4 text-[12px] font-medium text-text-2 border border-border-default rounded-lg hover:border-border-hi hover:text-text-1 transition-all font-mono flex items-center gap-2"
              >
                <span className="text-[11px]">⬇</span>
                Download .html
              </button>
              <button
                type="button"
                onClick={downloadBundle}
                disabled={!resultId}
                className="h-9 px-4 text-[12px] font-medium text-text-2 border border-border-default rounded-lg hover:border-border-hi hover:text-text-1 transition-all font-mono flex items-center gap-2 disabled:opacity-30"
              >
                <span className="text-[11px]">⬇</span>
                Bundle .zip
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="h-9 px-5 bg-accent text-bg-base font-syne font-bold text-[12px] tracking-tight rounded-lg hover:brightness-110 hover:shadow-accent-glow transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </Modal>
    )
  }

  // ── FORM STEP ───────────────────────────────────────────────────────────────
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
