# Phase 2 — Entity CRUD Design
# Clientes + Projetos

**Data:** 2026-04-02
**Pré-requisito:** Phase 1 (Foundation) concluída

---

## 1. Escopo

Implementar CRUD completo para as duas entidades centrais do sistema:

- **Clientes** — entidade simples (nome + contato), gerencia quem encomenda as LPs
- **Projetos** — entidade principal (nome, cliente, niche, sub_niche, page_type, briefing), cada projeto originará uma LP gerada

As rotas `/clientes` e `/projetos` já existem como skeletons (EmptyState). Esta fase as substitui por UIs funcionais com dados reais do Supabase.

---

## 2. Arquitetura

### Padrão de busca de dados
- **Server Components** para leitura (lista inicial): `createClient()` do `lib/supabase/server.ts`
- **Client Components** para mutações (criar/editar/deletar): `createClient()` do `lib/supabase/client.ts`
- Sem API Routes nesta fase — operações diretas via Supabase JS client (RLS garante segurança)

### Padrão de UI
- **Clientes:** tabela + modal dialog para criar/editar
- **Projetos:** grid de cards + slide-over drawer para criar/editar
- **Topbar actions:** botão "Novo X" injetado via portal no `#topbar-actions` usando `createPortal`

### Invalidação de cache
- Após mutações: `router.refresh()` para re-fetch dos Server Components
- Otimismo via estado local: lista atualizada imediatamente no cliente, sem esperar o refresh

---

## 3. Clientes

### 3.1 Lista (`/clientes`)

**Componente:** `app/(app)/clientes/page.tsx` (Server Component)

Tabela com colunas:
| Coluna | Fonte |
|--------|-------|
| Nome | `clientes.nome` |
| Contato | `clientes.contato` (email ou telefone, nullable) |
| Projetos | count de `projetos` vinculados (join no server) |
| Criado em | `clientes.created_at` formatado |
| Ações | botões Editar + Deletar |

Empty state: "Nenhum cliente ainda" com botão CTA para criar.

### 3.2 Modal Criar/Editar

**Componente:** `components/clientes/cliente-modal.tsx` (Client Component)

- Disparado pelo botão no topbar (novo) ou botão Editar na linha
- Campos: Nome (obrigatório), Contato (opcional — email ou telefone)
- Submit: `supabase.from('clientes').insert()` ou `.update()`
- Fecha ao salvar, chama `router.refresh()`

### 3.3 Deletar

- Botão Deletar na linha abre `AlertDialog` de confirmação (Shadcn)
- Mensagem: "Isso também deletará todos os projetos vinculados." (cascade no DB)
- Após confirmação: `supabase.from('clientes').delete().eq('id', id)`

---

## 4. Projetos

### 4.1 Lista (`/projetos`)

**Componente:** `app/(app)/projetos/page.tsx` (Server Component)

Grid de cards (3 colunas). Cada card exibe:
- Nome do projeto (destaque)
- Badge de status: Rascunho (cinza) / Gerando (amber pulse) / Concluído (teal)
- Nome do cliente (com link para `/clientes`)
- Niche + sub_niche + page_type em tags monocromáticas
- Data de criação
- Botão ações (⋮): Editar, Ver LP (se concluído), Deletar

**Status inicial de todo projeto novo:** `rascunho`
**Nota:** status `gerando` e `concluído` serão definidos pelas fases 4/5. Phase 2 cria sempre como `rascunho`.

Empty state: "Nenhum projeto ainda" com botão CTA.

### 4.2 Slide-Over Drawer Criar/Editar

**Componente:** `components/projetos/projeto-drawer.tsx` (Client Component)

Drawer lateral (direita, ~480px) com:

**Campos:**
| Campo | Tipo | Validação |
|-------|------|-----------|
| Nome | text input | obrigatório |
| Cliente | select (lista de clientes) | obrigatório |
| Niche | select predefinido | obrigatório |
| Sub-niche | select dependente do niche | obrigatório |
| Page type | select predefinido | obrigatório |
| Briefing | textarea (4–6 linhas) | opcional |

**Comportamento do sub-niche:** ao mudar o niche, o sub-niche reseta e exibe as opções do niche selecionado.

### 4.3 Valores Predefinidos

```typescript
export const NICHES: Record<string, string[]> = {
  'Infoproduto': ['Curso Online', 'Mentoria', 'Ebook', 'Evento', 'Comunidade'],
  'SaaS':        ['B2B', 'B2C', 'Produtividade', 'Fintech', 'EdTech'],
  'E-commerce':  ['Moda', 'Saúde', 'Eletrônicos', 'Casa', 'Suplementos'],
  'Saúde':       ['Fitness', 'Nutrição', 'Emagrecimento', 'Medicina', 'Estética'],
  'Serviços':    ['Agência', 'Consultoria', 'Coaching', 'Freelancer'],
}

export const PAGE_TYPES = [
  'Vendas (long form)',
  'Webinar',
  'Squeeze',
  'VSL',
  'Mentoria',
  'Lançamento',
]
```

### 4.4 Deletar

- AlertDialog: "Isso deletará a LP gerada vinculada, se houver."
- `supabase.from('projetos').delete().eq('id', id)`

---

## 5. Topbar Actions Portal

**Componente:** `components/shared/topbar-portal.tsx`

Injeta botões no `div#topbar-actions` do Topbar usando `createPortal`:

```typescript
// Uso em cada page (Client Component wrapper):
<TopbarPortal>
  <Button onClick={() => setOpen(true)}>Novo Cliente</Button>
</TopbarPortal>
```

Este padrão mantém o Topbar como componente puro enquanto permite que páginas injetem ações contextuais.

---

## 6. Estrutura de Arquivos

```
app/(app)/
  clientes/
    page.tsx                    ← Server Component (lista)
    ClientesClientWrapper.tsx   ← Client wrapper (portal + modal state)
  projetos/
    page.tsx                    ← Server Component (lista)
    ProjetosClientWrapper.tsx   ← Client wrapper (portal + drawer state)

components/
  clientes/
    cliente-modal.tsx           ← Modal criar/editar
    clientes-table.tsx          ← Tabela com ações
  projetos/
    projeto-drawer.tsx          ← Drawer criar/editar
    projetos-grid.tsx           ← Grid de cards
    projeto-card.tsx            ← Card individual
  shared/
    topbar-portal.tsx           ← Portal para #topbar-actions
    alert-confirm.tsx           ← AlertDialog genérico de confirmação
    empty-state.tsx             ← (já existe)

lib/
  constants/
    niches.ts                   ← NICHES + PAGE_TYPES predefinidos
```

---

## 7. Tratamento de Erros

- Erros de rede/Supabase: exibir toast de erro (Shadcn `useToast` ou estado local no formulário)
- Campo obrigatório vazio: validação client-side antes do submit (sem lib, verificação simples)
- Cascade delete: mensagem de aviso explícita no AlertDialog

---

## 8. Testes

- `__tests__/components/clientes/cliente-modal.test.tsx` — render do modal, submit com campos válidos/inválidos
- `__tests__/components/projetos/projeto-drawer.test.tsx` — render do drawer, dependência niche→sub_niche
- `__tests__/components/projetos/projeto-card.test.tsx` — render do card com diferentes status

Supabase client mockado em todos os testes.

---

## 9. Fora de Escopo nesta Fase

- Página de detalhe de projeto (`/projetos/[id]`) — Phase 5
- Filtros/busca nas listas — Phase 7
- Status `gerando` e `concluído` — Phases 4/5
- Contagem real de projetos no dashboard — Phase 7
