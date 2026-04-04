# Design Spec — Phase 6: Dashboard Vivo

**Data:** 2026-04-04
**Status:** Aprovado
**Fase:** 6 de N

---

## 1. Objetivo

Conectar o dashboard a dados reais do Supabase com atualização em tempo real via Supabase Realtime. Quando o usuário gera uma LP, adiciona uma referência ou extrai um design system, o dashboard atualiza automaticamente — sem reload, sem polling.

---

## 2. Arquitetura

### Padrão: Server Component + Client Wrapper com Realtime

```
app/(app)/dashboard/
  page.tsx              ← Server Component: busca dados iniciais (SSR)
  client-wrapper.tsx    ← Client Component: Realtime subscriptions + estado local
```

- `page.tsx` busca dados iniciais no servidor — primeira renderização é rápida (sem loading state)
- `client-wrapper.tsx` recebe dados iniciais como props, abre subscriptions Realtime, chama `refetchAll()` em qualquer evento

### Subscriptions Realtime (5 canais)

| Canal | Tabela | Eventos |
|-------|--------|---------|
| `dashboard-projetos` | `projetos` | INSERT, UPDATE, DELETE |
| `dashboard-referencias` | `referencias` | INSERT, DELETE |
| `dashboard-design-systems` | `design_systems` | INSERT, UPDATE, DELETE |
| `dashboard-paginas` | `paginas_geradas` | INSERT |
| `dashboard-jobs` | `jobs` | UPDATE |

Todos os canais chamam `refetchAll()` ao receber qualquer evento.

### Função `refetchAll`

```ts
async function refetchAll() {
  const [stats, activity, coverage] = await Promise.all([
    fetchStats(supabase),
    fetchActivity(supabase),
    fetchCoverage(supabase),
  ])
  setStats(stats)
  setActivity(activity)
  setCoverage(coverage)
}
```

Usa o Supabase JS client (browser), não o admin client. Dados públicos do usuário autenticado.

### Cleanup

```ts
useEffect(() => {
  // abre todos os canais
  return () => {
    supabase.removeAllChannels()
  }
}, [])
```

---

## 3. Queries

### Stats

```ts
const [
  { count: totalProjetos },
  { count: totalReferencias },
  { count: totalDs },
  { count: totalPaginas },
] = await Promise.all([
  supabase.from('projetos').select('*', { count: 'exact', head: true }),
  supabase.from('referencias').select('*', { count: 'exact', head: true }),
  supabase.from('design_systems').select('*', { count: 'exact', head: true }),
  supabase.from('paginas_geradas').select('*', { count: 'exact', head: true }),
])
```

**Delta dos StatCards:**
- projetos: `{N} total` ou `nenhum ainda`
- referências: `{N} na biblioteca` ou `nenhuma ainda`
- design systems: `{N} extraídos` ou `nenhum ainda`
- lps geradas: `{N} versões` ou `nenhuma ainda`

### Activity Feed

Três queries separadas, mergeadas e ordenadas por `created_at desc`, limitadas a 15 itens no total:

```ts
// paginas_geradas + nome do projeto
const { data: paginas } = await supabase
  .from('paginas_geradas')
  .select('id, created_at, version, projeto:projetos(nome)')
  .order('created_at', { ascending: false })
  .limit(10)

// design_systems
const { data: dsList } = await supabase
  .from('design_systems')
  .select('id, nome, status, created_at')
  .order('created_at', { ascending: false })
  .limit(10)

// referencias
const { data: refs } = await supabase
  .from('referencias')
  .select('id, nome, niche, page_type, created_at')
  .order('created_at', { ascending: false })
  .limit(10)
```

**Mapeamento para `ActivityItem`:**

```ts
type ActivityItem = {
  id: string
  name: string
  detail: string
  time: string   // "2h", "5min", "agora" — calculado a partir de created_at
  status: 'success' | 'processing' | 'info'
}
```

| Fonte | `name` | `detail` | `status` |
|-------|--------|----------|---------|
| `paginas_geradas` | `LP gerada — {projeto.nome}` | `versão {version}` | `success` |
| `design_systems` (status=processing) | `Extraindo DS — {nome}` | `processando...` | `processing` |
| `design_systems` (status=done) | `Design System — {nome}` | `extração concluída` | `info` |
| `referencias` | `Nova referência — {nome}` | `{niche} · {page_type}` | `info` |

**Tempo relativo:**
```ts
function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}
```

### Cobertura da Biblioteca

```ts
const { data: refs } = await supabase
  .from('referencias')
  .select('niche')

// Agrupa por niche no client
const countByNiche = refs?.reduce<Record<string, number>>((acc, r) => {
  acc[r.niche] = (acc[r.niche] ?? 0) + 1
  return acc
}, {}) ?? {}
```

**Niches fixos sempre exibidos** (com 0 se não tiver refs):
```ts
const FIXED_NICHES = [
  { label: 'Infoproduto', color: '#F0B429' },
  { label: 'SaaS',        color: '#00D4AA' },
  { label: 'E-commerce',  color: '#A78BFA' },
  { label: 'Saúde',       color: '#60A5FA' },
]
```

Percentual: `(count / totalReferencias) * 100`, máximo 100%.

---

## 4. Componentes

### `app/(app)/dashboard/page.tsx` (modificado)

Server Component. Chama `fetchStats`, `fetchActivity`, `fetchCoverage` usando `createClient()` (server). Passa os 3 datasets como props para `DashboardClientWrapper`.

### `app/(app)/dashboard/client-wrapper.tsx` (novo)

```tsx
'use client'
// Props: { initialStats, initialActivity, initialCoverage }
// Estado local: stats, activity, coverage
// useEffect: abre 5 subscriptions → refetchAll()
// Renderiza: StatCards + ActivityFeed + LibraryCoverage + QuickActions
```

### `components/dashboard/activity-feed.tsx` (modificado)

Remove `MOCK_ACTIVITY`. Passa a aceitar `items: ActivityItem[]` como prop. Sem lógica interna de dados.

### `StatCard` — sem alterações

Já aceita props. Apenas os valores passados mudam (de 0 para dados reais).

### `LIBRARY_COVERAGE` — removido de `page.tsx`

Passa a ser calculado dentro do client wrapper a partir dos dados reais.

---

## 5. Funções Helper (lib/dashboard.ts)

```ts
// lib/dashboard.ts
export type DashboardStats = { projetos: number; referencias: number; ds: number; paginas: number }
export type ActivityItem   = { id: string; name: string; detail: string; time: string; status: 'success' | 'processing' | 'info' }
export type CoverageItem   = { label: string; count: number; pct: number; color: string }

export async function fetchStats(supabase): Promise<DashboardStats>
export async function fetchActivity(supabase): Promise<ActivityItem[]>
export async function fetchCoverage(supabase): Promise<CoverageItem[]>
export function timeAgo(date: string): string
```

Essas funções são usadas tanto pelo Server Component (dados iniciais) quanto pelo Client Wrapper (refetch). Recebem o cliente Supabase como parâmetro para funcionar em ambos os contextos.

---

## 6. Testes

```
__tests__/
  lib/dashboard.test.ts              ← timeAgo, fetchStats mock, fetchActivity mock
  components/dashboard/
    activity-feed.test.tsx           ← aceita props, renderiza itens, status correto
```

`ActivityFeed` já tem testes existentes que precisam ser atualizados (mock → props).

---

## 7. Definição de Pronto

- [ ] `lib/dashboard.ts` com `fetchStats`, `fetchActivity`, `fetchCoverage`, `timeAgo`
- [ ] `dashboard/page.tsx` busca dados reais no SSR
- [ ] `dashboard/client-wrapper.tsx` com 5 subscriptions Realtime + `refetchAll`
- [ ] `activity-feed.tsx` aceita `items` como prop (sem mock interno)
- [ ] StatCards exibem counts reais
- [ ] Activity feed exibe eventos reais das 3 fontes
- [ ] Cobertura da biblioteca exibe contagem real por niche
- [ ] Ao criar projeto/referência/LP, dashboard atualiza sem reload
- [ ] Todos os testes passando
