'use client'

import { ApiKeysForm } from '@/components/configuracoes/api-keys-form'
import { ModelosForm } from '@/components/configuracoes/modelos-form'
import { PromptsForm } from '@/components/configuracoes/prompts-form'
import type { ConfiguracoesPublic } from '@/lib/types'

type Props = { config: ConfiguracoesPublic }

const ANCHORS = [
  { id: 'api-keys', label: 'API Keys',  color: '#F0B429' },
  { id: 'modelos',  label: 'Modelos',   color: '#00D4AA' },
  { id: 'prompts',  label: 'Prompts',   color: '#A78BFA' },
]

export function ConfiguracoesClientWrapper({ config }: Props) {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="max-w-3xl">
      {/* Anchor nav */}
      <div className="flex gap-0 mb-8 border-b border-[#1e2028]">
        {ANCHORS.map((a, i) => (
          <button
            key={a.id}
            onClick={() => scrollTo(a.id)}
            className="text-[12px] px-4 py-2.5 border-b-2 border-transparent transition-all font-mono"
            style={i === 0
              ? { color: a.color, borderBottomColor: a.color }
              : { color: '#555' }
            }
          >
            {a.label}
          </button>
        ))}
      </div>

      <ApiKeysForm
        anthropicKeySet={config.anthropic_key_set}
        openaiKeySet={config.openai_key_set}
      />

      <ModelosForm
        modeloDs={config.modelo_ds}
        modeloLp={config.modelo_lp}
      />

      <PromptsForm
        promptDs={config.prompt_ds}
        promptLp={config.prompt_lp}
      />
    </div>
  )
}
