'use client'

import { useState } from 'react'

type Props = {
  modeloDs: string
  modeloLp: string
}

const MODELOS = [
  { value: 'claude-opus-4-6',           label: 'claude-opus-4-6'           },
  { value: 'claude-sonnet-4-6',         label: 'claude-sonnet-4-6'         },
  { value: 'claude-haiku-4-5-20251001', label: 'claude-haiku-4-5-20251001' },
]

const selectClass =
  'w-full h-10 bg-[#07090F] border border-[#1e2028] rounded-lg px-3 text-[12px] text-text-1 font-mono outline-none transition-all duration-200 focus:border-[#00D4AA]/40 appearance-none cursor-pointer'

export function ModelosForm({ modeloDs, modeloLp }: Props) {
  const [ds,       setDs]       = useState(modeloDs)
  const [lp,       setLp]       = useState(modeloLp)
  const [loading,  setLoading]  = useState(false)
  const [feedback, setFeedback] = useState<'ok' | 'err' | null>(null)

  async function handleSave() {
    setLoading(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelo_ds: ds, modelo_lp: lp }),
      })
      setFeedback(res.ok ? 'ok' : 'err')
    } catch {
      setFeedback('err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="modelos" className="mb-10 scroll-mt-6">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-1">
        <span className="w-[3px] h-[15px] rounded-full inline-block" style={{ background: '#00D4AA' }} />
        <span className="font-syne font-bold text-[15px] text-text-1 tracking-tight">Modelos padrão</span>
      </div>
      <p className="font-mono text-[11px] text-text-3 mb-5 leading-relaxed" style={{ marginLeft: '11px' }}>
        Modelo usado por padrão em cada operação. Pode ser sobrescrito no formulário do gerador.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* DS select */}
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: '#111318', border: '1px solid #1e2028' }}
        >
          <div>
            <div className="font-syne font-bold text-[13px] text-text-1 mb-0.5">
              Extração de Design System
            </div>
            <div className="font-mono text-[10px] text-text-3">
              Velocidade &gt; qualidade — Sonnet recomendado
            </div>
          </div>
          <div className="relative">
            <select
              value={ds}
              onChange={e => setDs(e.target.value)}
              className={selectClass}
            >
              {MODELOS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none font-mono text-[10px]">▾</span>
          </div>
        </div>

        {/* LP select */}
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: '#111318', border: '1px solid #1e2028' }}
        >
          <div>
            <div className="font-syne font-bold text-[13px] text-text-1 mb-0.5">
              Geração de LP
            </div>
            <div className="font-mono text-[10px] text-text-3">
              Qualidade &gt; velocidade — Opus recomendado
            </div>
          </div>
          <div className="relative">
            <select
              value={lp}
              onChange={e => setLp(e.target.value)}
              className={selectClass}
            >
              {MODELOS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none font-mono text-[10px]">▾</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div>
          {feedback === 'ok' && (
            <span className="font-mono text-[11px] text-[#00D4AA]">Modelos salvos com sucesso</span>
          )}
          {feedback === 'err' && (
            <span className="font-mono text-[11px] text-red-400">Erro ao salvar</span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="h-9 px-6 bg-accent text-bg-base font-syne font-bold text-[12px] tracking-tight rounded-lg hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
              Salvando...
            </span>
          ) : 'Salvar modelos'}
        </button>
      </div>
    </div>
  )
}
