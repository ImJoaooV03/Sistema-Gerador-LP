# Design Spec — Phase 5: Configurações

**Data:** 2026-04-04
**Status:** Aprovado
**Fase:** 5 de N

---

## 1. Objetivo

Implementar a página de Configurações do sistema, permitindo gerenciar API keys, modelos padrão por operação e prompts editáveis — tudo sem redeploy. As configurações são persistidas no Supabase e lidas em runtime pelos flows de geração.

---

## 2. Banco de Dados

### Tabela `configuracoes` (singleton)

```sql
CREATE TABLE configuracoes (
  id              int PRIMARY KEY DEFAULT 1,
  anthropic_key   text,
  openai_key      text,
  modelo_ds       text NOT NULL DEFAULT 'claude-sonnet-4-6',
  modelo_lp       text NOT NULL DEFAULT 'claude-opus-4-6',
  prompt_ds       text,
  prompt_lp       text,
  updated_at      timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed: garantir que a linha existe
INSERT INTO configuracoes (id) VALUES (1) ON CONFLICT DO NOTHING;
```

- `prompt_ds` e `prompt_lp` sendo `null` significa "usar o prompt padrão hardcoded"
- `anthropic_key` e `openai_key` são salvas em texto mascarado no banco (uso interno)
- RLS desabilitado para esta tabela — acesso exclusivo via service_role nas API Routes

---

## 3. API Routes

### `GET /api/configuracoes`
- Busca a linha singleton via admin client (service_role)
- Retorna todos os campos **exceto** o valor real das keys — retorna apenas `{ anthropic_key_set: boolean, openai_key_set: boolean, ... }`
- Campos de modelo e prompt retornados em texto pleno

### `POST /api/configuracoes`
- Aceita body parcial — qualquer subconjunto dos campos
- Usa `UPDATE configuracoes SET ... WHERE id = 1`
- Retorna `{ ok: true }`

As keys são armazenadas no banco mascaradas — ao salvar uma nova key via `ApiKeysForm`, o valor real é enviado e armazenado. Ao ler, apenas o status (configurada ou não) é exposto ao frontend.

---

## 4. Página `/configuracoes`

### Estrutura de arquivos

```
app/(app)/configuracoes/
  page.tsx              ← Server Component: busca configs, passa para client
  client-wrapper.tsx    ← Client: renderiza os 3 formulários
components/configuracoes/
  api-keys-form.tsx     ← Formulário de API keys
  modelos-form.tsx      ← Selects de modelo por operação
  prompts-form.tsx      ← Textareas com contador de tokens
```

### Layout

Página única com scroll. Âncoras no topo (`#api-keys`, `#modelos`, `#prompts`) com scroll suave via `scrollIntoView`.

Cada seção tem marcador colorido lateral:
- API Keys → amber (`#F0B429`)
- Modelos → teal (`#00D4AA`)
- Prompts → purple (`#A78BFA`)

### `ApiKeysForm`

- Dois cards lado a lado: Anthropic e OpenAI
- Badge de status: `✓ configurada` (teal) ou `✗ não configurada` (cinza)
- Input `type="password"` com toggle show/hide (olho)
- Placeholder: `sk-ant-••••••••••••••••` (estático, não valor real)
- Botão por card: "Atualizar key" / "Adicionar key"
- Submit: `POST /api/configuracoes` com `{ anthropic_key: value }` ou `{ openai_key: value }`
- Deixar campo vazio = não altera a key existente

### `ModelosForm`

- Dois selects: "Extração de Design System" e "Geração de LP"
- Opções disponíveis:
  - `claude-opus-4-6`
  - `claude-sonnet-4-6`
  - `claude-haiku-4-5-20251001`
- Hint abaixo de cada select: "Velocidade > qualidade — Sonnet recomendado" / "Qualidade > velocidade — Opus recomendado"
- Botão único "Salvar modelos" → `POST /api/configuracoes` com `{ modelo_ds, modelo_lp }`

### `PromptsForm`

- Dois blocos: "Extração de Design System" e "Geração de LP"
- Textarea de altura fixa (12 linhas) com scroll interno
- Contador de tokens em tempo real: estimativa `Math.ceil(text.length / 4)` tokens
- Botão "Restaurar padrão" → reseta o textarea para o prompt padrão hardcoded (constante no código) — não salva automaticamente, apenas preenche o campo
- Botão "Salvar prompt" individual por bloco → `POST /api/configuracoes` com `{ prompt_ds }` ou `{ prompt_lp }`
- Feedback: toast de sucesso/erro após save

---

## 5. Integração com Flows Existentes

### Ordem de prioridade para modelo e prompt

```
valor escolhido no formulário (BriefingForm override)
  > config do banco (tabela configuracoes)
  > default hardcoded no código
```

### Alterações nas API Routes existentes

**`app/api/gerar-lp/route.ts`**
- Antes de iniciar a geração, busca `{ modelo_lp, prompt_lp }` da tabela `configuracoes`
- `modelo_lp` substitui o default; se o formulário enviou um modelo explícito, esse tem prioridade
- `prompt_lp` substitui o prompt hardcoded; se null, usa o padrão

**`app/api/editar-secao/route.ts`**
- Modo IA: lê `modelo_lp` do banco para a chamada Claude

**`app/api/design-systems/extract/route.ts`** (se existir) ou onde ocorre a extração de DS
- Lê `modelo_ds` e `prompt_ds` do banco antes de chamar o Claude

### Função helper

```ts
// lib/get-configuracoes.ts
export async function getConfiguracoes() {
  const { data } = await adminClient
    .from('configuracoes')
    .select('modelo_ds, modelo_lp, prompt_ds, prompt_lp, anthropic_key, openai_key')
    .single()
  return data
}
```

Usada pelas API Routes de geração. Nunca exposta ao frontend diretamente (contém keys).

---

## 6. Defaults Hardcoded (constantes)

```ts
// lib/defaults.ts
export const DEFAULT_MODELO_DS = 'claude-sonnet-4-6'
export const DEFAULT_MODELO_LP = 'claude-opus-4-6'

export const DEFAULT_PROMPT_DS = `# Extract HTML Design System v2
You are a Design System Showcase Builder.
...` // prompt completo do spec original

export const DEFAULT_PROMPT_LP = `Você é um gerador especializado em landing pages de alta conversão.
...` // prompt completo do spec original
```

Estes defaults são usados:
1. Como fallback quando `configuracoes.prompt_*` é null
2. Como valor de "Restaurar padrão" nos textareas

---

## 7. Testes

```
__tests__/components/configuracoes/
  api-keys-form.test.tsx    ← badge de status, toggle show/hide, submit por card
  modelos-form.tsx.test.tsx ← select correto, submit com ambos os modelos
  prompts-form.test.tsx     ← contador de tokens, restaurar padrão, submit individual
```

---

## 8. Definição de Pronto

- [ ] Migration aplicada, tabela `configuracoes` com linha singleton
- [ ] `GET /api/configuracoes` retorna status das keys (sem valor real) + modelos + prompts
- [ ] `POST /api/configuracoes` atualiza campos parcialmente
- [ ] `ApiKeysForm` salva key por provider, exibe badge ✓/✗
- [ ] `ModelosForm` salva modelos padrão
- [ ] `PromptsForm` edita prompts com contador de tokens e restaurar padrão
- [ ] Flows de geração leem modelo e prompt do banco (com fallback para defaults)
- [ ] `lib/get-configuracoes.ts` helper criado e usado pelas API Routes
- [ ] `lib/defaults.ts` com constantes de prompts e modelos padrão
- [ ] Todos os testes passando
- [ ] `/configuracoes` removido do placeholder EmptyState
