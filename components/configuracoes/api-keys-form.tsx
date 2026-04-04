'use client'

import { useState } from 'react'

type Props = {
  anthropicKeySet: boolean
  openaiKeySet: boolean
}

type Provider = 'anthropic' | 'openai'

const inputClass =
  'w-full h-10 bg-[#07090F] border border-[#1e2028] rounded-lg px-3 pr-10 text-[12px] text-text-1 font-mono outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(240,180,41,0.07)] placeholder:text-[#333]'

function KeyCard({
  label,
  provider,
  isSet,
  placeholder,
  fieldName,
}: {
  label: string
  provider: Provider
  isSet: boolean
  placeholder: string
  fieldName: string
}) {
  const [value,    setValue]    = useState('')
  const [show,     setShow]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [feedback, setFeedback] = useState<'ok' | 'err' | null>(null)

  async function handleSave() {
    if (!value.trim()) return
    setLoading(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [`${provider}_key`]: value.trim() }),
      })
      if (res.ok) {
        setFeedback('ok')
        setValue('')
      } else {
        setFeedback('err')
      }
    } catch {
      setFeedback('err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: '#111318', border: '1px solid #1e2028' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-syne font-bold text-[13px] text-text-1">{label}</span>
        {isSet ? (
          <span className="font-mono text-[9px] text-[#00D4AA] bg-[#00D4AA]/10 px-2 py-0.5 rounded tracking-wide">
            ✓ configurada
          </span>
        ) : (
          <span className="font-mono text-[9px] text-text-3 bg-[#1a1c22] px-2 py-0.5 rounded tracking-wide">
            ✗ não configurada
          </span>
        )}
      </div>

      {/* Label + Input */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[9px] text-text-3 uppercase tracking-[2px]">
          {fieldName}
        </span>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={placeholder}
            className={inputClass}
            disabled={loading}
          />
          <button
            type="button"
            aria-label="Mostrar"
            onClick={() => setShow(s => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-text-3 hover:text-text-1 transition-colors"
          >
            <span className="font-mono text-[10px]">{show ? '○' : '●'}</span>
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback === 'ok' && (
        <span className="font-mono text-[10px] text-[#00D4AA]">Key atualizada com sucesso</span>
      )}
      {feedback === 'err' && (
        <span className="font-mono text-[10px] text-red-400">Erro ao salvar — tente novamente</span>
      )}

      {/* Button */}
      <button
        onClick={handleSave}
        disabled={loading || !value.trim()}
        className="h-9 w-full rounded-lg font-syne font-bold text-[11px] tracking-tight transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'rgba(240,180,41,0.08)',
          border: '1px solid rgba(240,180,41,0.18)',
          color: '#F0B429',
        }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            Salvando...
          </span>
        ) : isSet ? 'Atualizar key' : 'Adicionar key'}
      </button>
    </div>
  )
}

export function ApiKeysForm({ anthropicKeySet, openaiKeySet }: Props) {
  return (
    <div id="api-keys" className="mb-10 scroll-mt-6">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-1">
        <span className="w-[3px] h-[15px] rounded-full inline-block" style={{ background: '#F0B429' }} />
        <span className="font-syne font-bold text-[15px] text-text-1 tracking-tight">API Keys</span>
      </div>
      <p className="font-mono text-[11px] text-text-3 mb-5 leading-relaxed" style={{ marginLeft: '11px' }}>
        Chaves salvas no banco e exibidas mascaradas. Deixe em branco para manter a atual.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <KeyCard
          label="Anthropic"
          provider="anthropic"
          isSet={anthropicKeySet}
          placeholder="sk-ant-••••••••••••••••"
          fieldName="ANTHROPIC_API_KEY"
        />
        <KeyCard
          label="OpenAI"
          provider="openai"
          isSet={openaiKeySet}
          placeholder="sk-••••••••••••••••••••••"
          fieldName="OPENAI_API_KEY"
        />
      </div>
    </div>
  )
}
