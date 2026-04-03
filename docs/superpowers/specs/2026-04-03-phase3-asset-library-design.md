# Phase 3 — Asset Library: Design Systems + Referências

**Data:** 2026-04-03
**Status:** Aprovado

---

## Objetivo

Construir a biblioteca de ativos de input que o gerador de IA (Phase 5) vai consumir:

1. **Design Systems** — upload de ZIP (index.html + assets), extração automática via Claude que gera um `design-system.html` completo e auto-contido.
2. **Referências** — upload de ZIP (index.html + assets + design-system.html) tagueado por niche/sub-niche/page-type; galeria com preview e drawer de detalhes.

---

## Fluxo Geral

### Design Systems

```
User faz upload de ZIP (index.html + assets/)
  → API Route /api/extract-ds
    → jszip descomprime em memória
    → lê index.html + todos os .css linkados + style tags inline
    → monta prompt para Claude
    → Claude retorna design-system.html completo (streaming)
  → salva ZIP no Supabase Storage (bucket: design-systems)
  → salva ds_html no banco (tabela design_systems)
  → status: pending → processing → done | error
  → UI mostra preview do design-system.html em iframe
  → dois botões: download .html | download .zip completo
```

### Referências

```
User faz upload de ZIP (index.html + assets/ + design-system.html)
  → preenche: nome, niche, sub-niche, page-type, observações (opcional)
  → API Route /api/upload-referencia
    → valida ZIP contém index.html
    → salva ZIP no Supabase Storage (bucket: referencias)
    → salva metadata no banco (tabela referencias)
  → aparece na galeria
  → clica no card → drawer lateral:
      → aba LP: iframe mostrando index.html servido via signed URL
      → aba Design System: iframe mostrando design-system.html
      → botão deletar (com AlertConfirm)
```

---

## Arquitetura de Componentes

### Design Systems (`/design-systems`)

| Arquivo | Tipo | Responsabilidade |
|---|---|---|
| `app/(app)/design-systems/page.tsx` | Server Component | Busca lista de DSs no banco, passa para wrapper |
| `app/(app)/design-systems/client-wrapper.tsx` | Client | Estado: upload modal aberto, DS selecionado para viewer |
| `app/(app)/design-systems/api/extract-ds/route.ts` | API Route | Recebe ZIP, unzip, chama Claude, salva Storage + DB |
| `components/design-systems/ds-card.tsx` | Client | Card com nome, data, badge de status (pending/processing/done/error) |
| `components/design-systems/ds-upload-modal.tsx` | Client | Modal com drag & drop de ZIP, botão confirmar upload |
| `components/design-systems/ds-viewer-drawer.tsx` | Client | Drawer com iframe do design-system.html + botões download |

### Referências (`/referencias`)

| Arquivo | Tipo | Responsabilidade |
|---|---|---|
| `app/(app)/referencias/page.tsx` | Server Component | Busca lista de referências, passa para wrapper |
| `app/(app)/referencias/client-wrapper.tsx` | Client | Estado: upload drawer, viewer drawer, filtro de niche ativo |
| `app/(app)/referencias/api/upload-referencia/route.ts` | API Route | Recebe ZIP + metadata, salva Storage + DB |
| `components/referencias/referencia-card.tsx` | Client | Card com iframe preview do index.html (lazy), tags de niche |
| `components/referencias/referencia-upload-drawer.tsx` | Client | Drawer de upload: drag & drop + campos niche/sub-niche/page-type |
| `components/referencias/referencia-viewer-drawer.tsx` | Client | Drawer lateral: abas LP / Design System via iframe, botão deletar |
| `components/referencias/niche-filter-bar.tsx` | Client | Filtro rápido por niche (pills clicáveis) — filtra sem reload |

---

## Schema — Mudanças no Banco

### Migration: `design_systems` — novas colunas

```sql
alter table design_systems
  add column if not exists ds_html    text,
  add column if not exists status     text not null default 'pending'
    check (status in ('pending', 'processing', 'done', 'error')),
  add column if not exists error_msg  text;
```

> `storage_path` já existe na tabela — usado para o path do ZIP original.

### Migration: Supabase Storage buckets

```sql
-- Executar via Supabase Dashboard → Storage → New Bucket
-- bucket: design-systems (privado)
-- bucket: referencias (privado)
```

Acesso via `signed URL` com expiração de 1h — gerado server-side na page.tsx antes de passar para os componentes.

---

## API Routes

### `POST /api/extract-ds`

**Request:** `multipart/form-data` — campo `file` (ZIP), campo `nome` (string)

**Processo:**
1. Valida que o ZIP contém `index.html`
2. Insere registro no banco com `status = 'processing'`
3. Unzipa em memória com `jszip`
4. Lê `index.html` + todos os `.css` linkados via `<link>` tags + `<style>` blocks inline
5. Constrói prompt para Claude (ver seção Prompt)
6. Chama Claude API com streaming
7. Ao finalizar: salva `ds_html` no banco, atualiza `status = 'done'`
8. Faz upload do ZIP original para Supabase Storage `design-systems/{id}.zip`
9. Em caso de erro: `status = 'error'`, salva `error_msg`

**Response:** `{ id, status, ds_html }` — 200 OK

### `POST /api/upload-referencia`

**Request:** `multipart/form-data` — campos: `file` (ZIP), `nome`, `niche`, `sub_niche`, `page_type`, `observacoes?`

**Processo:**
1. Valida que ZIP contém `index.html`
2. Faz upload para Supabase Storage `referencias/{id}.zip`
3. Insere registro na tabela `referencias`

**Response:** `{ id }` — 201 Created

---

## Prompt Claude — Extração de Design System

```
Você receberá o código-fonte completo de uma landing page (HTML + CSS).
Analise tudo e gere um arquivo `design-system.html` completo, auto-contido e visualmente rico.

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

CÓDIGO-FONTE DA LP:
[HTML + CSS inserido aqui]
```

---

## UI — Design Systems Page

**Estado inicial (sem DSs):** empty state com ícone + "Nenhum design system" + botão "Adicionar Design System"

**Estado com cards:**
- Grid 3 colunas de `DsCard`
- Cada card: nome, data de criação, badge de status
  - `pending` → cinza "Aguardando"
  - `processing` → amber pulsando "Extraindo..."
  - `done` → teal "Concluído"
  - `error` → vermelho "Erro" + tooltip com mensagem
- Hover: borda ilumina, botão "Ver" aparece
- Click → abre `DsViewerDrawer`

**DsViewerDrawer (480px):**
- Header: nome do DS + botão X
- Body: iframe com `ds_html` (height: 100%, scrollável)
- Footer fixo: botão "Download .html" + botão "Download .zip completo"
- Durante `processing`: skeleton loader no iframe + spinner amber

---

## UI — Referências Page

**NicheFilterBar:** pills de niche no topo da página (Todos | Infoproduto | SaaS | E-commerce | Saúde | Serviços). Filtra o grid client-side sem reload.

**Grid 3 colunas de `ReferenciaCard`:**
- Iframe preview do `index.html` via signed URL (lazy load — só carrega quando card está no viewport, usando IntersectionObserver)
- Overlay no hover com nome + tags de niche/page-type
- Click → abre `ReferenciaViewerDrawer`

**ReferenciaUploadDrawer (480px):**
- Drag & drop de ZIP (ou clique para selecionar)
- Campos: Nome, Niche, Sub-niche (dependente), Page Type
- Campo Observações (textarea, opcional)
- Validação: ZIP obrigatório, nome obrigatório, niche obrigatório
- Botão "Enviar" amber

**ReferenciaViewerDrawer (640px — mais largo para preview):**
- Header: nome + pills de niche/page-type + botão X
- Tabs: "LP Completa" | "Design System"
- Aba LP: iframe full-height com index.html via signed URL
- Aba Design System: iframe full-height com design-system.html extraído do ZIP
- Footer: botão "Deletar" (abre AlertConfirm destrutivo)

---

## Serving de Arquivos Estáticos (iframe com assets)

O `index.html` referencia assets relativos (`assets/style.css`, `assets/img/hero.jpg` etc). Um signed URL simples apontando para o ZIP não resolve isso.

**Solução: API Route de serving dinâmico**

```
GET /api/serve/[bucket]/[id]/[...path]
  → busca o ZIP no Supabase Storage: {bucket}/{id}.zip
  → extrai o arquivo em {path} com jszip
  → retorna com Content-Type correto (text/html, text/css, image/png…)
```

Exemplos de URL gerados:
```
/api/serve/referencias/abc123/index.html
/api/serve/referencias/abc123/assets/style.css
/api/serve/referencias/abc123/assets/images/hero.jpg
/api/serve/design-systems/xyz789/index.html
```

O iframe do card e do viewer aponta para `/api/serve/{bucket}/{id}/index.html`.
Como os assets usam paths relativos, o browser os resolve corretamente a partir desse base URL.

**Cache:** response com `Cache-Control: private, max-age=3600` — evita re-download do ZIP a cada request de asset.

**Rota única:** `app/api/serve/[bucket]/[id]/[...path]/route.ts` — atende ambos os módulos.

---

## Segurança

- ZIPs servidos via **signed URLs** com expiração de 1h — nunca públicos
- iframes usam `sandbox="allow-scripts allow-same-origin"` — sem acesso ao DOM pai
- Upload limitado a 50MB por arquivo
- Validação server-side que o ZIP contém `index.html` antes de processar
- API Routes protegidas pelo middleware Supabase (usuário autenticado)

---

## Testes

| Arquivo | O que testa |
|---|---|
| `__tests__/components/design-systems/ds-card.test.tsx` | Renderiza badge por status (pending/processing/done/error) |
| `__tests__/components/design-systems/ds-upload-modal.test.tsx` | Validação de arquivo, chama onUpload com File correto |
| `__tests__/components/referencias/referencia-card.test.tsx` | Renderiza nome, niche, sub-niche |
| `__tests__/components/referencias/referencia-upload-drawer.test.tsx` | Niche → sub-niche dependente, validação de campos obrigatórios |
| `__tests__/components/referencias/niche-filter-bar.test.tsx` | Clique em pill muda filtro ativo |

---

## Dependências npm a adicionar

```bash
npm install jszip @anthropic-ai/sdk
```

> `@anthropic-ai/sdk` será usado aqui pela primeira vez — também servirá na Phase 5 (gerador).

---

## Checklist de Conclusão

- [ ] Migration `design_systems` aplicada (status + ds_html + error_msg)
- [ ] Storage buckets `design-systems` e `referencias` criados
- [ ] `/api/extract-ds` funcionando com Claude (retorna ds_html completo)
- [ ] `/api/upload-referencia` funcionando
- [ ] `/design-systems` — grid + upload modal + viewer drawer + status badge
- [ ] `/referencias` — grid + filter bar + upload drawer + viewer drawer (abas LP/DS)
- [ ] API Route `/api/serve/[bucket]/[id]/[...path]` — serving dinâmico de assets do ZIP
- [ ] Preview de LPs via iframe lazy (IntersectionObserver)
- [ ] Download .html e .zip do design system funcionando
- [ ] Todos os testes passando
- [ ] Build limpo
