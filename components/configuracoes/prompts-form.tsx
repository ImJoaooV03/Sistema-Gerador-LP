'use client'

import { useState } from 'react'
import { DEFAULT_PROMPT_DS, DEFAULT_PROMPT_LP } from '@/lib/defaults'

type Props = {
  promptDs: string | null
  promptLp: string | null
}

type PromptKey = 'ds' | 'lp'

function PromptBlock({
  title,
  promptKey,
  initialValue,
  defaultValue,
}: {
  title: string
  promptKey: PromptKey
  initialValue: string
  defaultValue: string
}) {
  const [value,    setValue]    = useState(initialValue)
  const [loading,  setLoading]  = useState(false)
  const [feedback, setFeedback] = useState<'ok' | 'err' | null>(null)

  const tokenCount = Math.ceil(value.length / 4)
  const fieldName  = promptKey === 'ds' ? 'prompt_ds' : 'prompt_lp'

  async function handleSave() {
    setLoading(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldName]: value }),
      })
      setFeedback(res.ok ? 'ok' : 'err')
    } catch {
      setFeedback('err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-xl p-4 mb-3"
      style={{ background: '#111318', border: '1px solid #1e2028' }}
    >
      {/* Block header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-syne font-bold text-[13px] text-text-1">
          Prompt — {title}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-text-3">
            ~{tokenCount} tokens
          </span>
          <button
            type="button"
            onClick={() => setValue(defaultValue)}
            className="h-6 px-2.5 font-mono text-[10px] text-text-3 rounded transition-all duration-150 hover:text-text-1"
            style={{ background: '#1a1c22', border: '1px solid #2a2a2a' }}
          >
            Restaurar padrão
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={12}
        disabled={loading}
        className="w-full bg-[#07090F] border border-[#1e2028] rounded-lg px-3 py-2.5 font-mono text-[11px] text-text-2 leading-relaxed outline-none resize-none transition-all duration-200 focus:border-[#A78BFA]/40 focus:shadow-[0_0_0_3px_rgba(167,139,250,0.05)] disabled:opacity-60"
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <div>
          {feedback === 'ok' && (
            <span className="font-mono text-[10px] text-[#00D4AA]">Prompt salvo</span>
          )}
          {feedback === 'err' && (
            <span className="font-mono text-[10px] text-red-400">Erro ao salvar</span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="h-8 px-4 bg-accent text-bg-base font-syne font-bold text-[11px] tracking-tight rounded-lg hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
              Salvando...
            </span>
          ) : 'Salvar prompt'}
        </button>
      </div>
    </div>
  )
}

export function PromptsForm({ promptDs, promptLp }: Props) {
  return (
    <div id="prompts" className="mb-10 scroll-mt-6">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-1">
        <span className="w-[3px] h-[15px] rounded-full inline-block" style={{ background: '#A78BFA' }} />
        <span className="font-syne font-bold text-[15px] text-text-1 tracking-tight">Prompts editáveis</span>
      </div>
      <p className="font-mono text-[11px] text-text-3 mb-5 leading-relaxed" style={{ marginLeft: '11px' }}>
        Edite os prompts base usados pela IA. Alterações aplicadas na próxima geração.
      </p>

      <PromptBlock
        title="Extração de Design System"
        promptKey="ds"
        initialValue={promptDs ?? DEFAULT_PROMPT_DS}
        defaultValue={DEFAULT_PROMPT_DS}
      />
      <PromptBlock
        title="Geração de LP"
        promptKey="lp"
        initialValue={promptLp ?? DEFAULT_PROMPT_LP}
        defaultValue={DEFAULT_PROMPT_LP}
      />
    </div>
  )
}
