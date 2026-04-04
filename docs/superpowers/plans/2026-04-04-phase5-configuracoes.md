# Phase 5 — Configurações Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> 🎨 **DESIGN TASKS:** Tasks marcadas com 🎨 requerem invocar `/frontend-design` ANTES de implementar os componentes visuais.

**Goal:** Implementar a página de Configurações — gerenciamento de API keys, modelos padrão e prompts editáveis — persistidos no Supabase e consumidos em runtime pelos flows de geração.

**Architecture:** Tabela `configuracoes` singleton (uma linha, id=1) no Supabase com colunas tipadas. `lib/defaults.ts` contém os prompts e modelos padrão hardcoded. `lib/get-configuracoes.ts` é o helper compartilhado pelas API Routes de geração. Página `/configuracoes` usa Server Component + Client Wrapper com 3 formulários independentes.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase JS + service_role admin, @anthropic-ai/sdk, Tailwind v4, Vitest + @testing-library/react

---

## File Structure

```
supabase/migrations/
  20260404000000_configuracoes.sql         ← cria tabela + seed singleton

lib/
  defaults.ts                              ← constantes DEFAULT_MODELO_DS/LP, DEFAULT_PROMPT_DS/LP
  get-configuracoes.ts                     ← helper: lê config do banco via admin client
  types.ts                                 ← adiciona tipo Configuracoes

app/
  api/
    configuracoes/
      route.ts                             ← GET (status de keys + modelos + prompts) / POST (update parcial)
  (app)/
    configuracoes/
      page.tsx                             ← Server Component: busca configs, passa para client wrapper
      client-wrapper.tsx                   ← Client: âncoras + renderiza os 3 formulários

components/
  configuracoes/
    api-keys-form.tsx                      ← cards Anthropic/OpenAI com badge status + input senha
    modelos-form.tsx                       ← selects de modelo por operação
    prompts-form.tsx                       ← textareas com contador de tokens + restaurar padrão

__tests__/components/configuracoes/
  api-keys-form.test.tsx
  modelos-form.test.tsx
  prompts-form.test.tsx

# Arquivos modificados (integração):
app/(app)/design-systems/api/extract-ds/route.ts   ← lê modelo_ds + prompt_ds do banco
app/api/gerar-lp/route.ts                           ← lê modelo_lp + prompt_lp do banco
app/api/editar-secao/route.ts                       ← lê modelo_lp do banco
```

---

## Step 1 — Migration + Defaults + Types

### Step 1.1 — Criar migration `configuracoes`

- [ ] **Criar `supabase/migrations/20260404000000_configuracoes.sql`**

```sql
CREATE TABLE configuracoes (
  id            int PRIMARY KEY DEFAULT 1,
  anthropic_key text,
  openai_key    text,
  modelo_ds     text NOT NULL DEFAULT 'claude-sonnet-4-6',
  modelo_lp     text NOT NULL DEFAULT 'claude-opus-4-6',
  prompt_ds     text,
  prompt_lp     text,
  updated_at    timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Garante que a linha singleton existe
INSERT INTO configuracoes (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Sem RLS — acesso exclusivo via service_role nas API Routes
ALTER TABLE configuracoes DISABLE ROW LEVEL SECURITY;
```

- [ ] **Aplicar migration via MCP Supabase**

  Usar `mcp__claude_ai_Supabase__apply_migration` com o conteúdo acima.

- [ ] **Verificar que a tabela existe e tem a linha singleton**

  Usar `mcp__claude_ai_Supabase__execute_sql`:
  ```sql
  SELECT * FROM configuracoes;
  ```
  Esperado: uma linha com id=1, modelos default, resto null.

- [ ] **Commit**

```bash
git add supabase/migrations/20260404000000_configuracoes.sql
git commit -m "feat: add configuracoes table migration"
```

---

### Step 1.2 — Criar `lib/defaults.ts`

- [ ] **Criar `lib/defaults.ts`**

```ts
export const DEFAULT_MODELO_DS = 'claude-sonnet-4-6'
export const DEFAULT_MODELO_LP = 'claude-opus-4-6'

export const DEFAULT_PROMPT_DS = `Você receberá o código-fonte completo de uma landing page (HTML + CSS).
Analise tudo e gere um arquivo design-system.html completo, auto-contido e visualmente rico.

O arquivo deve documentar TODOS os seguintes elementos com exemplos renderizados:

IDENTIDADE VISUAL
- Paleta de cores completa: primária, secundária, accent, neutras, semânticas (sucesso/erro/alerta)
- Gradientes utilizados
- Background colors e superfícies

TIPOGRAFIA
- Famílias de fonte (display, body, mono) com exemplos reais
- Escala completa de tamanhos (h1 → h2 → h3 → p → small → caption)
- Pesos (font-weight) e line-heights
- Letter-spacing por nível

LAYOUT & ESPAÇAMENTO
- Escala de espaçamento identificada (4px, 8px, 16px, 24px, 32px...)
- Largura máxima do container e grid
- Breakpoints responsivos detectados
- Border-radius usados
- Padrão de padding de seções

COMPONENTES
- Botões: primário, secundário, ghost, outline — com hover state descrito
- Inputs e formulários
- Cards e containers
- Badges, tags, pills
- Separadores e divisores

DOBRAS / SEÇÕES DA LP
- Estrutura identificada de cada dobra (Hero, Benefícios, Prova Social, Oferta, CTA, etc.)
- Padrão visual de cada tipo de seção
- Como os CTAs são apresentados em cada dobra

EFEITOS & MOVIMENTO
- Box-shadows e text-shadows usados
- Animações e transições (CSS keyframes, transitions)
- Efeitos de hover
- Overlays, opacidades, blur

FORMATO DO OUTPUT:
- HTML único, auto-contido (sem CDN externo), com CSS inline no <style>
- Visual dark ou light seguindo o tema da LP original
- Cada seção bem delimitada com heading claro
- Swatches de cor renderizados como divs coloridos com hex values
- Todos os exemplos de tipografia renderizados nas fontes reais
- Botões e componentes renderizados funcionalmente
- Código-fonte limpo, organizado em seções com comentários

Responda APENAS com o HTML completo. Sem explicações, sem markdown. Comece com <!DOCTYPE html>.

CÓDIGO-FONTE DA LP:
`

export const DEFAULT_PROMPT_LP = `Você é um especialista em landing pages de alta conversão.
Você NÃO cria estilos novos. Você recombina padrões das referências fornecidas.

## BRIEFING DO PROJETO
Nome: {NOME}
Nicho: {NICHE} / {SUB_NICHE}
Tipo de página: {PAGE_TYPE}
Briefing: {BRIEFING}

## REFERÊNCIAS SELECIONADAS
{REFERENCIAS}

## REGRAS OBRIGATÓRIAS
1. Use APENAS classes CSS que existem nas referências acima. Não invente nenhuma nova classe.
2. Adapte o CONTEÚDO (textos, headings, CTAs, benefícios) ao briefing do projeto.
3. A estrutura de seções deve ser inspirada nas referências.
4. Gere uma landing page completa e funcional.
5. Retorne o HTML completo delimitado exatamente assim (sem nada antes ou depois das tags):

<LP_HTML>
{html completo da landing page, começando com <!DOCTYPE html>}
</LP_HTML>

6. Após o HTML, retorne o JSON de seções delimitado exatamente assim:

<LP_SECTIONS>
[{"id":"hero","label":"Hero","order":0,"html":"...HTML exato da seção..."},{"id":"beneficios","label":"Benefícios","order":1,"html":"..."}]
</LP_SECTIONS>

O "html" de cada seção deve ser um substring exato do HTML gerado acima.
Identifique de 4 a 8 seções principais (hero, problema, benefícios, prova social, oferta, cta, etc).`
```

- [ ] **Commit**

```bash
git add lib/defaults.ts
git commit -m "feat: add defaults.ts with prompts and model constants"
```

---

### Step 1.3 — Adicionar tipo `Configuracoes` em `lib/types.ts`

- [ ] **Adicionar ao final de `lib/types.ts`**

```ts
export type Configuracoes = {
  id: number
  anthropic_key: string | null
  openai_key: string | null
  modelo_ds: string
  modelo_lp: string
  prompt_ds: string | null
  prompt_lp: string | null
  updated_at: string
}

// Versão segura para o frontend — sem as keys reais
export type ConfiguracoesPublic = {
  anthropic_key_set: boolean
  openai_key_set: boolean
  modelo_ds: string
  modelo_lp: string
  prompt_ds: string | null
  prompt_lp: string | null
}
```

- [ ] **Commit**

```bash
git add lib/types.ts
git commit -m "feat: add Configuracoes and ConfiguracoesPublic types"
```

---

### Step 1.4 — Criar `lib/get-configuracoes.ts`

- [ ] **Criar `lib/get-configuracoes.ts`**

```ts
import { createAdminClient } from '@/lib/supabase/admin'
import type { Configuracoes } from '@/lib/types'
import { DEFAULT_MODELO_DS, DEFAULT_MODELO_LP } from '@/lib/defaults'

export async function getConfiguracoes(): Promise<Configuracoes> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('configuracoes')
    .select('*')
    .eq('id', 1)
    .single()

  return data ?? {
    id: 1,
    anthropic_key: null,
    openai_key: null,
    modelo_ds: DEFAULT_MODELO_DS,
    modelo_lp: DEFAULT_MODELO_LP,
    prompt_ds: null,
    prompt_lp: null,
    updated_at: new Date().toISOString(),
  }
}
```

- [ ] **Commit**

```bash
git add lib/get-configuracoes.ts
git commit -m "feat: add getConfiguracoes helper"
```

---

## Step 2 — API Route `/api/configuracoes`

### Step 2.1 — Criar `app/api/configuracoes/route.ts`

- [ ] **Criar `app/api/configuracoes/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ConfiguracoesPublic } from '@/lib/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('configuracoes')
    .select('anthropic_key, openai_key, modelo_ds, modelo_lp, prompt_ds, prompt_lp')
    .eq('id', 1)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const response: ConfiguracoesPublic = {
    anthropic_key_set: !!data?.anthropic_key,
    openai_key_set:    !!data?.openai_key,
    modelo_ds:         data?.modelo_ds ?? 'claude-sonnet-4-6',
    modelo_lp:         data?.modelo_lp ?? 'claude-opus-4-6',
    prompt_ds:         data?.prompt_ds ?? null,
    prompt_lp:         data?.prompt_lp ?? null,
  }

  return NextResponse.json(response)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const body = await req.json() as Partial<{
      anthropic_key: string
      openai_key: string
      modelo_ds: string
      modelo_lp: string
      prompt_ds: string
      prompt_lp: string
    }>

    // Filtra campos vazios para não sobrescrever keys existentes com string vazia
    const updates: Record<string, string> = {}
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === 'string' && v.trim() !== '') {
        updates[k] = v.trim()
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true })
    }

    updates.updated_at = new Date().toISOString()

    const admin = createAdminClient()
    const { error } = await admin
      .from('configuracoes')
      .update(updates)
      .eq('id', 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
```

- [ ] **Verificar build**

```bash
npm run build 2>&1 | tail -20
```
Esperado: sem erros de TypeScript.

- [ ] **Commit**

```bash
git add app/api/configuracoes/route.ts
git commit -m "feat: add GET/POST /api/configuracoes route"
```

---

## Step 3 — Integração nos Flows Existentes

### Step 3.1 — Atualizar `app/(app)/design-systems/api/extract-ds/route.ts`

- [ ] **Substituir o prompt e modelo hardcoded por leitura do banco**

  No arquivo `app/(app)/design-systems/api/extract-ds/route.ts`:

  1. Remover a constante `ANTHROPIC_PROMPT` do topo do arquivo.
  2. Adicionar import:
  ```ts
  import { getConfiguracoes } from '@/lib/get-configuracoes'
  import { DEFAULT_PROMPT_DS, DEFAULT_MODELO_DS } from '@/lib/defaults'
  ```
  3. Dentro do bloco `try`, antes da chamada `anthropic.messages.create`, adicionar:
  ```ts
  const config = await getConfiguracoes()
  const promptDs = config.prompt_ds ?? DEFAULT_PROMPT_DS
  const modeloDs = config.modelo_ds ?? DEFAULT_MODELO_DS
  ```
  4. Substituir a chamada do Claude:
  ```ts
  // ANTES:
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 8192,
    messages: [{ role: 'user', content: ANTHROPIC_PROMPT + sourceCode }],
  })

  // DEPOIS:
  const message = await anthropic.messages.create({
    model: modeloDs,
    max_tokens: 8192,
    messages: [{ role: 'user', content: promptDs + sourceCode }],
  })
  ```

- [ ] **Verificar build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Commit**

```bash
git add app/(app)/design-systems/api/extract-ds/route.ts
git commit -m "feat: extract-ds reads modelo_ds and prompt_ds from configuracoes"
```

---

### Step 3.2 — Atualizar `app/api/gerar-lp/route.ts`

- [ ] **Adicionar leitura de config no início de `runGeneration`**

  No arquivo `app/api/gerar-lp/route.ts`:

  1. Adicionar imports:
  ```ts
  import { getConfiguracoes } from '@/lib/get-configuracoes'
  import { DEFAULT_PROMPT_LP, DEFAULT_MODELO_LP } from '@/lib/defaults'
  ```

  2. Remover a constante `LP_GENERATION_PROMPT` do topo do arquivo.

  3. No início de `runGeneration`, após `const admin = createAdminClient()`, adicionar:
  ```ts
  const config = await getConfiguracoes()
  const promptLp = config.prompt_lp ?? DEFAULT_PROMPT_LP
  ```

  4. A função recebe `modelo` como parâmetro (vem do formulário). Aplicar fallback para o valor do banco:
  ```ts
  // Em runGeneration, substituir a assinatura:
  // ANTES: async function runGeneration(projetoId: string, modelo: string)
  // DEPOIS: (sem mudança de assinatura — modelo já vem do POST como override)
  // Mas adicionar fallback caso o POST não receba modelo explícito:
  ```

  5. No `POST` handler, onde `modelo` é resolvido, mudar para:
  ```ts
  // ANTES:
  const modelo = body.modelo?.trim() || 'claude-opus-4-6'

  // DEPOIS:
  const config = await getConfiguracoes()
  const modelo = body.modelo?.trim() || config.modelo_lp || DEFAULT_MODELO_LP
  ```

  6. Substituir o uso de `LP_GENERATION_PROMPT` na função `runGeneration`:
  ```ts
  // ANTES:
  const prompt = LP_GENERATION_PROMPT
    .replace('{NOME}', projeto.nome)
    ...

  // DEPOIS:
  const prompt = promptLp
    .replace('{NOME}', projeto.nome)
    .replace('{NICHE}', projeto.niche)
    .replace('{SUB_NICHE}', projeto.sub_niche)
    .replace('{PAGE_TYPE}', projeto.page_type)
    .replace('{BRIEFING}', projeto.briefing ?? '')
    .replace('{REFERENCIAS}', buildReferencesBlock(refsContent))
  ```

  > Nota: `config` e `promptLp` devem ser buscados dentro de `runGeneration` (não no POST handler) para garantir que o valor mais recente é usado no momento da geração assíncrona. Mover a busca de config para dentro de `runGeneration`.

  Versão final correta de `runGeneration` (início):
  ```ts
  async function runGeneration(projetoId: string, modelo: string) {
    const admin = createAdminClient()
    const config = await getConfiguracoes()
    const promptLp = config.prompt_lp ?? DEFAULT_PROMPT_LP

    try {
      // ... resto do código ...
    }
  }
  ```

  E no POST handler:
  ```ts
  const config = await getConfiguracoes()
  const modelo = body.modelo?.trim() || config.modelo_lp || DEFAULT_MODELO_LP
  ```

- [ ] **Verificar build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Commit**

```bash
git add app/api/gerar-lp/route.ts
git commit -m "feat: gerar-lp reads modelo_lp and prompt_lp from configuracoes"
```

---

### Step 3.3 — Atualizar `app/api/editar-secao/route.ts`

- [ ] **Adicionar leitura de modelo_lp no modo IA**

  No arquivo `app/api/editar-secao/route.ts`:

  1. Adicionar imports:
  ```ts
  import { getConfiguracoes } from '@/lib/get-configuracoes'
  import { DEFAULT_MODELO_LP } from '@/lib/defaults'
  ```

  2. Na linha onde `modelo` é resolvido (modo IA), substituir:
  ```ts
  // ANTES:
  const modelo = iaBody.modelo || metadata.modelo || 'claude-sonnet-4-6'

  // DEPOIS:
  const config = await getConfiguracoes()
  const modelo = iaBody.modelo || metadata.modelo || config.modelo_lp || DEFAULT_MODELO_LP
  ```

- [ ] **Verificar build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Commit**

```bash
git add app/api/editar-secao/route.ts
git commit -m "feat: editar-secao reads modelo_lp from configuracoes"
```

---

## Step 4 — 🎨 Componentes (frontend-design obrigatório)

> **OBRIGATÓRIO:** Invocar `/frontend-design` ANTES de implementar qualquer componente desta etapa.

### Step 4.1 — Testes dos componentes

- [ ] **Criar `__tests__/components/configuracoes/api-keys-form.test.tsx`**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}))

import { ApiKeysForm } from '@/components/configuracoes/api-keys-form'

describe('ApiKeysForm', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
  })

  it('shows teal badge when key is set', () => {
    render(<ApiKeysForm anthropicKeySet={true} openaiKeySet={false} />)
    expect(screen.getByText(/configurada/i)).toBeInTheDocument()
    expect(screen.getByText(/não configurada/i)).toBeInTheDocument()
  })

  it('shows gray badge when key is not set', () => {
    render(<ApiKeysForm anthropicKeySet={false} openaiKeySet={false} />)
    expect(screen.getAllByText(/não configurada/i)).toHaveLength(2)
  })

  it('toggles password visibility when eye button is clicked', () => {
    render(<ApiKeysForm anthropicKeySet={false} openaiKeySet={false} />)
    const inputs = screen.getAllByPlaceholderText(/sk-/i)
    expect(inputs[0]).toHaveAttribute('type', 'password')
    const toggles = screen.getAllByLabelText(/mostrar/i)
    fireEvent.click(toggles[0])
    expect(inputs[0]).toHaveAttribute('type', 'text')
  })

  it('submits anthropic key and calls POST /api/configuracoes', async () => {
    render(<ApiKeysForm anthropicKeySet={false} openaiKeySet={false} />)
    const inputs = screen.getAllByPlaceholderText(/sk-/i)
    fireEvent.change(inputs[0], { target: { value: 'sk-ant-test123' } })
    const buttons = screen.getAllByRole('button', { name: /key/i })
    fireEvent.click(buttons[0])
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/configuracoes', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ anthropic_key: 'sk-ant-test123' }),
      }))
    })
  })

  it('does not submit when input is empty', async () => {
    render(<ApiKeysForm anthropicKeySet={false} openaiKeySet={false} />)
    const buttons = screen.getAllByRole('button', { name: /key/i })
    fireEvent.click(buttons[0])
    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})
```

- [ ] **Criar `__tests__/components/configuracoes/modelos-form.test.tsx`**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

import { ModelosForm } from '@/components/configuracoes/modelos-form'

describe('ModelosForm', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
  })

  it('renders both selects with current values', () => {
    render(<ModelosForm modeloDs="claude-sonnet-4-6" modeloLp="claude-opus-4-6" />)
    const selects = screen.getAllByRole('combobox')
    expect(selects).toHaveLength(2)
    expect(selects[0]).toHaveValue('claude-sonnet-4-6')
    expect(selects[1]).toHaveValue('claude-opus-4-6')
  })

  it('has all three model options in each select', () => {
    render(<ModelosForm modeloDs="claude-sonnet-4-6" modeloLp="claude-opus-4-6" />)
    const options = screen.getAllByRole('option', { name: /claude-opus-4-6/i })
    expect(options.length).toBeGreaterThanOrEqual(2)
  })

  it('submits both modelo values on save', async () => {
    render(<ModelosForm modeloDs="claude-sonnet-4-6" modeloLp="claude-opus-4-6" />)
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'claude-haiku-4-5-20251001' } })
    fireEvent.click(screen.getByRole('button', { name: /salvar modelos/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/configuracoes', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ modelo_ds: 'claude-haiku-4-5-20251001', modelo_lp: 'claude-opus-4-6' }),
      }))
    })
  })
})
```

- [ ] **Criar `__tests__/components/configuracoes/prompts-form.test.tsx`**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

import { PromptsForm } from '@/components/configuracoes/prompts-form'
import { DEFAULT_PROMPT_DS, DEFAULT_PROMPT_LP } from '@/lib/defaults'

describe('PromptsForm', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
  })

  it('renders textareas with current prompt values', () => {
    render(<PromptsForm promptDs="prompt ds customizado" promptLp="prompt lp customizado" />)
    const textareas = screen.getAllByRole('textbox')
    expect(textareas[0]).toHaveValue('prompt ds customizado')
    expect(textareas[1]).toHaveValue('prompt lp customizado')
  })

  it('shows token count based on text length', () => {
    render(<PromptsForm promptDs="aaaa" promptLp="" />)
    // 4 chars / 4 = 1 token
    expect(screen.getByText(/1 tokens/i)).toBeInTheDocument()
  })

  it('restaurar padrao button fills textarea with DEFAULT_PROMPT_DS', () => {
    render(<PromptsForm promptDs="customizado" promptLp="" />)
    const restoreButtons = screen.getAllByRole('button', { name: /restaurar padrão/i })
    fireEvent.click(restoreButtons[0])
    const textareas = screen.getAllByRole('textbox')
    expect(textareas[0]).toHaveValue(DEFAULT_PROMPT_DS)
  })

  it('submits prompt_ds individually', async () => {
    render(<PromptsForm promptDs="meu prompt ds" promptLp="" />)
    const saveButtons = screen.getAllByRole('button', { name: /salvar prompt/i })
    fireEvent.click(saveButtons[0])
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/configuracoes', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ prompt_ds: 'meu prompt ds' }),
      }))
    })
  })

  it('submits prompt_lp individually', async () => {
    render(<PromptsForm promptDs="" promptLp="meu prompt lp" />)
    const saveButtons = screen.getAllByRole('button', { name: /salvar prompt/i })
    fireEvent.click(saveButtons[1])
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/configuracoes', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ prompt_lp: 'meu prompt lp' }),
      }))
    })
  })
})
```

- [ ] **Rodar testes — verificar FAIL (componentes ainda não existem)**

```bash
npx vitest run __tests__/components/configuracoes/ 2>&1 | tail -30
```
Esperado: FAIL com "Cannot find module '@/components/configuracoes/..."

- [ ] **Commit dos testes**

```bash
git add __tests__/components/configuracoes/
git commit -m "test: add failing tests for configuracoes components"
```

---

### Step 4.2 — 🎨 Implementar componentes (invocar /frontend-design primeiro)

> **INVOCAR `/frontend-design` AGORA** antes de implementar os componentes abaixo.
> Contexto para o frontend-design: página de configurações dark, estética "dark precision", tokens:
> accent=#F0B429, teal=#00D4AA, purple=#A78BFA, bg=#07090F, elevated=#111318, border=#1e2028,
> text-1=#e0e0e0, text-3=#555. Fontes: Syne (headings), JetBrains Mono (labels/code), DM Sans (body).
> 3 componentes: ApiKeysForm, ModelosForm, PromptsForm — todos usam Tailwind v4.

- [ ] **Criar `components/configuracoes/api-keys-form.tsx`**

```tsx
'use client'

import { useState } from 'react'

type Props = {
  anthropicKeySet: boolean
  openaiKeySet: boolean
}

type Provider = 'anthropic' | 'openai'

const inputClass =
  'w-full h-10 bg-[#07090F] border border-[#1e2028] rounded-lg px-3 text-[12px] text-text-1 font-mono outline-none transition-all focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(240,180,41,0.09)]'

const labelClass = 'text-[9px] uppercase tracking-[2px] text-text-3 font-mono'

function KeyCard({
  label,
  provider,
  isSet,
  placeholder,
}: {
  label: string
  provider: Provider
  isSet: boolean
  placeholder: string
}) {
  const [value, setValue]     = useState('')
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
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
      setFeedback(res.ok ? 'ok' : 'err')
      if (res.ok) setValue('')
    } catch {
      setFeedback('err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-elevated border border-[#1e2028] rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-text-1 font-syne">{label}</span>
        {isSet ? (
          <span className="text-[10px] text-[#00D4AA] bg-[#00D4AA]/10 px-2 py-0.5 rounded font-mono">
            ✓ configurada
          </span>
        ) : (
          <span className="text-[10px] text-text-3 bg-[#1a1c22] px-2 py-0.5 rounded font-mono">
            ✗ não configurada
          </span>
        )}
      </div>

      {/* Input */}
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>{provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'}</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={placeholder}
            className={inputClass + ' pr-10'}
            disabled={loading}
          />
          <button
            type="button"
            aria-label={show ? 'Ocultar' : 'Mostrar'}
            onClick={() => setShow(s => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-1 transition-colors text-[12px]"
          >
            {show ? '○' : '●'}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback === 'ok' && (
        <span className="text-[11px] text-[#00D4AA] font-mono">Key atualizada com sucesso</span>
      )}
      {feedback === 'err' && (
        <span className="text-[11px] text-red-400 font-mono">Erro ao salvar — tente novamente</span>
      )}

      {/* Button */}
      <button
        onClick={handleSave}
        disabled={loading || !value.trim()}
        className="h-9 w-full bg-accent/10 border border-accent/20 text-accent text-[12px] font-bold font-syne rounded-lg hover:bg-accent/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            Salvando...
          </span>
        ) : isSet ? 'Atualizar key' : 'Adicionar key'}
      </button>
    </div>
  )
}

export function ApiKeysForm({ anthropicKeySet, openaiKeySet }: Props) {
  return (
    <div id="api-keys" className="mb-10 scroll-mt-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="w-[3px] h-[14px] bg-accent rounded-full inline-block" />
        <span className="text-[14px] font-bold text-text-1 font-syne">API Keys</span>
      </div>
      <p className="text-[11px] text-text-3 mb-4 ml-[11px]">
        Chaves são salvas no banco e exibidas mascaradas. Deixe em branco para manter a atual.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <KeyCard
          label="Anthropic"
          provider="anthropic"
          isSet={anthropicKeySet}
          placeholder="sk-ant-••••••••••••••••"
        />
        <KeyCard
          label="OpenAI"
          provider="openai"
          isSet={openaiKeySet}
          placeholder="sk-••••••••••••••••••••••••"
        />
      </div>
    </div>
  )
}
```

- [ ] **Criar `components/configuracoes/modelos-form.tsx`**

```tsx
'use client'

import { useState } from 'react'

type Props = {
  modeloDs: string
  modeloLp: string
}

const MODELOS = [
  { value: 'claude-opus-4-6',        label: 'claude-opus-4-6'        },
  { value: 'claude-sonnet-4-6',      label: 'claude-sonnet-4-6'      },
  { value: 'claude-haiku-4-5-20251001', label: 'claude-haiku-4-5-20251001' },
]

const selectClass =
  'w-full h-10 bg-[#07090F] border border-[#1e2028] rounded-lg px-3 text-[12px] text-text-1 font-mono outline-none transition-all focus:border-accent/50 appearance-none cursor-pointer'

export function ModelosForm({ modeloDs, modeloLp }: Props) {
  const [ds, setDs]           = useState(modeloDs)
  const [lp, setLp]           = useState(modeloLp)
  const [loading, setLoading] = useState(false)
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
    <div id="modelos" className="mb-10 scroll-mt-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="w-[3px] h-[14px] bg-[#00D4AA] rounded-full inline-block" />
        <span className="text-[14px] font-bold text-text-1 font-syne">Modelos padrão</span>
      </div>
      <p className="text-[11px] text-text-3 mb-4 ml-[11px]">
        Modelo usado por padrão em cada operação. Pode ser sobrescrito no formulário do gerador.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* DS */}
        <div className="bg-elevated border border-[#1e2028] rounded-xl p-4 flex flex-col gap-3">
          <div>
            <div className="text-[13px] font-bold text-text-1 font-syne mb-0.5">
              Extração de Design System
            </div>
            <div className="text-[11px] text-text-3">Velocidade &gt; qualidade — Sonnet recomendado</div>
          </div>
          <div className="relative">
            <select value={ds} onChange={e => setDs(e.target.value)} className={selectClass}>
              {MODELOS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none text-[10px]">▾</span>
          </div>
        </div>

        {/* LP */}
        <div className="bg-elevated border border-[#1e2028] rounded-xl p-4 flex flex-col gap-3">
          <div>
            <div className="text-[13px] font-bold text-text-1 font-syne mb-0.5">
              Geração de LP
            </div>
            <div className="text-[11px] text-text-3">Qualidade &gt; velocidade — Opus recomendado</div>
          </div>
          <div className="relative">
            <select value={lp} onChange={e => setLp(e.target.value)} className={selectClass}>
              {MODELOS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none text-[10px]">▾</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        {feedback === 'ok' && <span className="text-[11px] text-[#00D4AA] font-mono">Modelos salvos</span>}
        {feedback === 'err' && <span className="text-[11px] text-red-400 font-mono">Erro ao salvar</span>}
        {!feedback && <span />}
        <button
          onClick={handleSave}
          disabled={loading}
          className="h-9 px-5 bg-accent text-bg-base text-[12px] font-bold font-syne rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar modelos'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Criar `components/configuracoes/prompts-form.tsx`**

```tsx
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
  const [value, setValue]       = useState(initialValue)
  const [loading, setLoading]   = useState(false)
  const [feedback, setFeedback] = useState<'ok' | 'err' | null>(null)

  const tokenCount = Math.ceil(value.length / 4)
  const fieldName = promptKey === 'ds' ? 'prompt_ds' : 'prompt_lp'

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
    <div className="bg-elevated border border-[#1e2028] rounded-xl p-4 mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-bold text-text-1 font-syne">
          Prompt — {title}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-3 font-mono">~{tokenCount} tokens</span>
          <button
            type="button"
            onClick={() => setValue(defaultValue)}
            className="h-6 px-2.5 bg-[#1a1c22] border border-[#2a2a2a] text-text-3 text-[10px] rounded hover:text-text-1 hover:border-[#3a3a3a] transition-all"
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
        className="w-full bg-[#07090F] border border-[#1e2028] rounded-lg px-3 py-2.5 text-[11px] text-text-2 font-mono outline-none resize-none transition-all focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(240,180,41,0.09)]"
        disabled={loading}
      />

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5">
        <div>
          {feedback === 'ok' && <span className="text-[11px] text-[#00D4AA] font-mono">Prompt salvo</span>}
          {feedback === 'err' && <span className="text-[11px] text-red-400 font-mono">Erro ao salvar</span>}
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="h-8 px-4 bg-accent text-bg-base text-[11px] font-bold font-syne rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar prompt'}
        </button>
      </div>
    </div>
  )
}

export function PromptsForm({ promptDs, promptLp }: Props) {
  return (
    <div id="prompts" className="mb-10 scroll-mt-4">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="w-[3px] h-[14px] bg-[#A78BFA] rounded-full inline-block" />
        <span className="text-[14px] font-bold text-text-1 font-syne">Prompts editáveis</span>
      </div>
      <p className="text-[11px] text-text-3 mb-4 ml-[11px]">
        Edite os prompts base usados pela IA. Alterações aplicadas imediatamente na próxima geração.
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
```

- [ ] **Rodar testes — verificar PASS**

```bash
npx vitest run __tests__/components/configuracoes/ 2>&1 | tail -30
```
Esperado: todos os testes passando (verde).

- [ ] **Commit dos componentes**

```bash
git add components/configuracoes/
git commit -m "feat: add ApiKeysForm, ModelosForm, PromptsForm components"
```

---

## Step 5 — Página `/configuracoes`

### Step 5.1 — Criar `app/(app)/configuracoes/client-wrapper.tsx`

- [ ] **Criar `app/(app)/configuracoes/client-wrapper.tsx`**

```tsx
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
            className="text-[12px] text-text-3 px-4 py-2.5 border-b-2 border-transparent hover:text-text-1 transition-all"
            style={i === 0 ? { color: a.color, borderBottomColor: a.color } : undefined}
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
```

### Step 5.2 — Substituir `app/(app)/configuracoes/page.tsx`

- [ ] **Substituir o conteúdo do placeholder em `app/(app)/configuracoes/page.tsx`**

```tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { ConfiguracoesClientWrapper } from './client-wrapper'
import { DEFAULT_MODELO_DS, DEFAULT_MODELO_LP } from '@/lib/defaults'
import type { ConfiguracoesPublic } from '@/lib/types'

export default async function ConfiguracoesPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('configuracoes')
    .select('anthropic_key, openai_key, modelo_ds, modelo_lp, prompt_ds, prompt_lp')
    .eq('id', 1)
    .single()

  const config: ConfiguracoesPublic = {
    anthropic_key_set: !!data?.anthropic_key,
    openai_key_set:    !!data?.openai_key,
    modelo_ds:         data?.modelo_ds ?? DEFAULT_MODELO_DS,
    modelo_lp:         data?.modelo_lp ?? DEFAULT_MODELO_LP,
    prompt_ds:         data?.prompt_ds ?? null,
    prompt_lp:         data?.prompt_lp ?? null,
  }

  return <ConfiguracoesClientWrapper config={config} />
}
```

- [ ] **Verificar build completo**

```bash
npm run build 2>&1 | tail -30
```
Esperado: sem erros de TypeScript, build bem-sucedido.

- [ ] **Rodar todos os testes**

```bash
npx vitest run 2>&1 | tail -20
```
Esperado: todos os testes passando.

- [ ] **Commit final**

```bash
git add app/(app)/configuracoes/
git commit -m "feat: add configuracoes page (server component + client wrapper)"
```

---

## Step 6 — Commit Final da Phase 5

- [ ] **Verificar build final limpo**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Rodar suite completa de testes**

```bash
npx vitest run 2>&1 | tail -30
```

- [ ] **Commit de fechamento da fase**

```bash
git commit --allow-empty -m "feat: Phase 5 complete — Configurações (API keys, modelos, prompts editáveis)"
```

---

## Definição de Pronto

- [ ] Migration aplicada, tabela `configuracoes` com linha singleton
- [ ] `lib/defaults.ts` com constantes de prompts e modelos padrão
- [ ] `lib/get-configuracoes.ts` helper criado
- [ ] `GET /api/configuracoes` retorna status das keys + modelos + prompts
- [ ] `POST /api/configuracoes` atualiza campos parcialmente (campos vazios ignorados)
- [ ] `ApiKeysForm` salva key por provider, exibe badge ✓/✗, toggle show/hide
- [ ] `ModelosForm` salva ambos os modelos com um clique
- [ ] `PromptsForm` edita prompts com contador de tokens e restaurar padrão
- [ ] Flows de geração leem modelo e prompt do banco (fallback para defaults)
- [ ] Todos os testes passando
- [ ] Build sem erros
