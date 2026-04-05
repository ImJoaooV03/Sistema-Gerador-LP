'use client'

import { useState, useRef, useEffect } from 'react'
import { Modal } from '@/components/shared/modal'

type DsUploadModalProps = {
  open: boolean
  onClose: () => void
  onUpload: (id: string, dsHtml: string) => void
}

type Step = 'form' | 'processing' | 'success'

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
  const [processingId,   setProcessingId]   = useState('')
  const [processingNome, setProcessingNome] = useState('')
  const [activeTab, setActiveTab] = useState<'url' | 'zip'>('url')
  const [url,       setUrl]       = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Polling when in processing step ────────────────────────────────────────
  useEffect(() => {
    if (step !== 'processing' || !processingId) return

    let cancelled = false
    const POLL_INTERVAL = 4000
    const MAX_WAIT = 8 * 60 * 1000 // 8 minutes
    const startedAt = Date.now()

    async function poll() {
      if (cancelled) return
      if (Date.now() - startedAt > MAX_WAIT) {
        setError('Tempo limite excedido. O Claude pode estar sobrecarregado — tente novamente.')
        setStep('form')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/design-systems/${processingId}/status`)
        if (!res.ok) { setTimeout(poll, POLL_INTERVAL); return }
        const json: { status: string; ds_html?: string | null; error_msg?: string | null } = await res.json()

        if (json.status === 'done') {
          setResultId(processingId)
          setResultHtml(json.ds_html ?? '')
          setResultNome(processingNome)
          setStep('success')
          setLoading(false)
        } else if (json.status === 'error') {
          setError(json.error_msg ?? 'Erro ao extrair design system')
          setStep('form')
          setLoading(false)
        } else {
          setTimeout(poll, POLL_INTERVAL)
        }
      } catch {
        if (!cancelled) setTimeout(poll, POLL_INTERVAL)
      }
    }

    const timer = setTimeout(poll, POLL_INTERVAL)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [step, processingId, processingNome])

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
    setProcessingId('')
    setProcessingNome('')
    setActiveTab('url')
    setUrl('')
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
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `${resultNome.replace(/\s+/g, '-').toLowerCase()}-design-system.html`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function downloadBundle() {
    if (!resultId) return
    const res = await fetch(`/api/design-systems/${resultId}/bundle`)
    if (!res.ok) return
    const blob = await res.blob()
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `${resultNome.replace(/\s+/g, '-').toLowerCase()}-bundle.zip`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Nome é obrigatório'); return }

    setLoading(true)
    setError(null)
    setProgress(10)

    try {
      if (activeTab === 'url') {
        // ── URL path ──────────────────────────────────────────────────────────
        const trimmedUrl = url.trim()
        if (!trimmedUrl) { setError('URL é obrigatória'); setLoading(false); setProgress(0); return }
        if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
          setError('URL deve começar com http:// ou https://'); setLoading(false); setProgress(0); return
        }

        const res = await fetch('/api/design-systems/from-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: nome.trim(), url: trimmedUrl }),
        })
        setProgress(90)

        const text = await res.text()
        let json: { error?: string; id?: string } = {}
        try { json = JSON.parse(text) } catch {
          setError(`Erro ${res.status}: ${text.slice(0, 120)}`); setLoading(false); setProgress(0); return
        }
        if (!res.ok) { setError(json.error ?? 'Erro ao iniciar extração'); setLoading(false); setProgress(0); return }

        setProgress(100)
        setProcessingId(json.id ?? '')
        setProcessingNome(nome.trim())
        setStep('processing')

      } else {
        // ── ZIP path ──────────────────────────────────────────────────────────
        if (!file) { setError('Selecione um arquivo ZIP'); setLoading(false); setProgress(0); return }

        const initRes = await fetch('/api/design-systems/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: nome.trim() }),
        })
        const initText = await initRes.text()
        let initJson: { error?: string; id?: string; uploadUrl?: string } = {}
        try { initJson = JSON.parse(initText) } catch {
          setError(`Erro ${initRes.status}: ${initText.slice(0, 120)}`); setLoading(false); setProgress(0); return
        }
        if (!initRes.ok) { setError(initJson.error ?? 'Erro ao inicializar'); setLoading(false); setProgress(0); return }

        const { id: dsId, uploadUrl } = initJson as { id: string; uploadUrl: string }

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('PUT', uploadUrl)
          xhr.setRequestHeader('Content-Type', 'application/octet-stream')
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              const pct = 30 + Math.round((ev.loaded / ev.total) * 40)
              setProgress(pct)
            }
          }
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve()
            else reject(new Error(`Upload falhou: ${xhr.status} ${xhr.responseText.slice(0, 120)}`))
          }
          xhr.onerror = () => reject(new Error('Erro de rede ao enviar arquivo'))
          xhr.send(file)
        })

        setProgress(75)

        const extractRes = await fetch(`/api/design-systems/${dsId}/extract`, { method: 'POST' })
        setProgress(90)

        const extractText = await extractRes.text()
        let extractJson: { error?: string; id?: string } = {}
        try { extractJson = JSON.parse(extractText) } catch {
          setError(`Erro ${extractRes.status}: ${extractText.slice(0, 120)}`); setLoading(false); setProgress(0); return
        }
        if (!extractRes.ok) { setError(extractJson.error ?? 'Erro ao extrair'); setLoading(false); setProgress(0); return }

        setProgress(100)
        setProcessingId(extractJson.id ?? dsId)
        setProcessingNome(nome.trim())
        setStep('processing')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
      setLoading(false)
      setProgress(0)
    }
  }

  // ── PROCESSING STEP ─────────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <Modal open={open} onClose={() => {}} className="max-w-[420px] mx-4">
        <div className="px-6 py-10 flex flex-col items-center gap-5">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-border-default" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="font-syne font-bold text-[15px] text-text-1">{processingNome}</h2>
            <p className="font-mono text-[10px] text-accent uppercase tracking-[1.5px] mt-1">
              Claude está analisando o design system
            </p>
            <p className="font-mono text-[10px] text-text-3 mt-2">
              Isso pode levar alguns minutos...
            </p>
          </div>
        </div>
      </Modal>
    )
  }

  // ── SUCCESS STEP ────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <Modal open={open} onClose={handleClose} className="w-[92vw] max-w-[1100px] mx-4 h-[88vh]">
        <div className="flex flex-col h-full">
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
            Extrair de URL ou ZIP
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

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(19,26,36,0.8)', border: '1px solid #1E2B3C' }}>
          {(['url', 'zip'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => { setActiveTab(tab); setError(null) }}
              disabled={loading}
              className="flex-1 h-8 rounded-md font-mono text-[11px] uppercase tracking-[1.5px] transition-all"
              style={{
                background: activeTab === tab ? 'rgba(240,180,41,0.1)' : 'transparent',
                border: activeTab === tab ? '1px solid rgba(240,180,41,0.3)' : '1px solid transparent',
                color: activeTab === tab ? '#F0B429' : '#64748B',
              }}
            >
              {tab === 'url' ? 'URL' : 'ZIP'}
            </button>
          ))}
        </div>

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

        {activeTab === 'url' ? (
          /* URL field */
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ds-url" className={labelClass}>
              URL da página <span className="text-accent">*</span>
            </label>
            <input
              id="ds-url"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://exemplo.com"
              className={inputClass}
              disabled={loading}
            />
            <p className="font-mono text-[10px] text-text-3 opacity-60">
              A página deve ser pública e acessível sem login.
            </p>
          </div>
        ) : (
          /* ZIP drag & drop */
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
              <p className="font-mono text-[10px] text-text-3 opacity-50">Máx. 500MB</p>
            </div>
          </div>
        )}

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
              {activeTab === 'url' ? 'Buscando...' : 'Enviando...'}
            </span>
          ) : (
            activeTab === 'url' ? 'Extrair de URL' : 'Extrair de ZIP'
          )}
        </button>
      </div>
    </Modal>
  )
}
