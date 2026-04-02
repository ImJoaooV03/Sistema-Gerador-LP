# Design Spec — Sistema de IA para Geração de Landing Pages

**Data:** 2026-04-01
**Status:** Aprovado
**Equipe:** 2–5 pessoas (uso interno)

---

## 1. Visão Geral

Sistema inteligente que gera landing pages de alta conversão automaticamente, combinando uma biblioteca de referências reais (HTML + Design Systems) com processamento via IA. A IA não cria layouts do zero — ela recombina padrões estruturais existentes e adapta o conteúdo ao briefing do projeto.

**Diferencial:** a biblioteca de referências é o núcleo do sistema. Quanto mais referências, maior a qualidade e variedade das páginas geradas.

---

## 2. Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend + API | Next.js 14 (App Router) |
| UI | React + TailwindCSS + Shadcn/UI |
| Banco de dados | Supabase (Postgres) |
| Storage | Supabase Storage |
| Autenticação | Supabase Auth (email/senha) |
| IA | Multi-provider: Claude, GPT-4o e outros (configurável) |
| Deploy | Vercel (Next.js) + Supabase Cloud |

**Decisão de arquitetura:** monolito Next.js (Opção A). Um único repositório, API Routes para todas as operações, jobs assíncronos com polling para operações longas. Adequado para equipe pequena sem overhead de infraestrutura.

---

## 3. Modelo de Dados

### Tabelas Supabase (Postgres)

#### `clientes`
```
id          uuid PK
nome        text
contato     text
created_at  timestamptz
```

#### `projetos`
```
id          uuid PK
cliente_id  uuid FK → clientes.id
nome        text
niche       text
sub_niche   text
page_type   text
briefing    text
created_at  timestamptz
```

#### `design_systems`
```
id            uuid PK
nome          text
storage_path  text   -- pasta no Storage: design-systems/{id}/
created_at    timestamptz
```

#### `referencias`
```
id               uuid PK
design_system_id uuid FK → design_systems.id
nome             text
niche            text
sub_niche        text
page_type        text
tags             text[]
observacoes      text
storage_path     text   -- pasta no Storage: referencias/{id}/
created_at       timestamptz
```

#### `paginas_geradas`
```
id          uuid PK
projeto_id  uuid FK → projetos.id
html_output text
preview_url text
sections    jsonb  -- array de seções editáveis com nome e HTML de cada dobra
version     int
created_at  timestamptz
```

#### `jobs`
```
id         uuid PK
type       text   -- 'ds_extraction' | 'lp_generation'
status     text   -- 'pending' | 'running' | 'done' | 'error'
payload    jsonb  -- IDs e parâmetros da operação
result     jsonb  -- dados do resultado
error      text
created_at timestamptz
```

### Supabase Storage — Estrutura de Pastas

```
uploads/                          ← ZIPs temporários (limpo após extração)
design-systems/{id}/
  index.html
  design-system.html
  assets/
referencias/{id}/
  index.html
  design-system.html
  assets/
paginas/{id}/
  output.html
```

### Validação de Referência

Toda referência deve conter obrigatoriamente:
- `index.html`
- `design-system.html`
- `assets/` (pasta de recursos)

O sistema bloqueia o cadastro se algum desses arquivos estiver ausente.

---

## 4. Fluxo de Jobs Assíncronos

Operações longas (extração de DS e geração de LP) usam um padrão de job assíncrono:

1. API recebe a requisição e cria um registro em `jobs` com `status: pending`
2. Retorna `job_id` imediatamente para o frontend
3. Processamento ocorre em background (API Route com `waitUntil` no Vercel, ou chamada encadeada)
4. Status atualizado para `running` → `done` | `error`
5. Frontend faz polling a cada 3 segundos consultando `GET /api/jobs/{id}`

Sem WebSockets. Polling simples e confiável para a escala atual.

---

## 5. Fluxo 1 — Upload e Extração de Design System

```
Usuário  →  Faz upload de ZIP (index.html + assets)
API      →  Valida ZIP, extrai arquivos, salva em uploads/{id}/
API      →  Cria job ds_extraction (status: pending), retorna job_id
IA       →  Lê index.html extraído
IA       →  Executa prompt "Extract HTML Design System v2" (ver Seção 7)
IA       →  Gera design-system.html com 7 seções documentadas
API      →  Salva design-system.html no Storage
API      →  Atualiza job (status: done)
Frontend →  Para de fazer polling, exibe preview do design-system.html
Usuário  →  Revisa preview + opção de download do design-system.html
Usuário  →  Clica "Confirmar e salvar na biblioteca"
API      →  Cria registro em design_systems, move arquivos para design-systems/{id}/
```

---

## 6. Fluxo 2 — Geração de Landing Page

```
Usuário  →  Cria projeto: cliente, nome, niche, sub_niche, page_type, briefing, modelo de IA
API      →  Cria job lp_generation (status: pending), retorna job_id
IA       →  Filtra referencias por niche + sub_niche + page_type (SQL exato)
IA       →  Ranqueia por sobreposição de tags com palavras-chave do briefing
IA       →  Fallback: se < 2 resultados, abre filtro para niche apenas
IA       →  Seleciona top 2–3 automaticamente (sem intervenção do usuário)
IA       →  Lê index.html + design-system.html de cada referência selecionada
IA       →  Extrai estrutura de seções, recombina dobras, adapta conteúdo ao briefing
IA       →  Gera HTML final usando apenas classes e estilos das referências
API      →  Salva html_output + sections JSON em paginas_geradas (version++)
API      →  Atualiza job (status: done)
Frontend →  Exibe preview (iframe inline + botão "Abrir em nova aba")
Usuário  →  Edita seções individualmente ou faz download do HTML
```

**Regras do motor de geração:**
- Não criar estilos novos ou inventar componentes
- Reutilizar apenas classes CSS existentes nas referências
- Seleção de referências é 100% automática (sem escolha manual)
- Cada geração cria uma nova versão (`version++`) preservando o histórico

---

## 7. Prompt de Extração de Design System

O prompt abaixo é enviado ao modelo configurado após a extração do ZIP. `$ARGUMENTS` é substituído pelo conteúdo do `index.html` extraído.

```
# Extract HTML Design System v2

You are a Design System Showcase Builder.
You are given a reference website HTML:

$ARGUMENTS

Your task is to create one new intermediate HTML file that acts as a living
design system + pattern library for this exact design.

## GOAL
Generate one single file called: design-system.html

## HARD RULES (NON-NEGOTIABLE)
1. Do not redesign or invent new styles.
2. Reuse exact class names, animations, timing, easing, hover/focus states.
3. Reference the same CSS/JS assets used by the original.
4. If a style/component is not used in the reference HTML, do not add it.
5. The file must be self-explanatory by structure (sections = documentation).
6. Include a top horizontal nav with anchor links to each section.

## SECTIONS
0) Hero (exact clone, text adapted to present the Design System)
1) Typography (spec table com live previews)
2) Colors & Surfaces (backgrounds, borders, gradients)
3) UI Components (buttons, inputs, cards — com estados)
4) Layout & Spacing (containers, grids, paddings)
5) Motion & Interaction (animações, hover states, transitions)
6) Icons (somente se presentes no original)
```

O prompt é editável na tela de Configurações do sistema.

---

## 8. Editor de Seções (Pós-Geração)

Após a geração, o usuário pode editar qualquer seção/dobra individualmente:

### Modo Código
- Editor HTML com syntax highlight
- Opera sobre a seção selecionada isoladamente
- Salva e re-renderiza o preview ao confirmar

### Modo IA
- Campo de texto: usuário descreve a alteração desejada
- IA reescreve apenas aquela seção
- Mantém obrigatoriamente as classes do design system das referências usadas
- Atualiza `html_output` e `sections` do registro atual (não cria nova versão — apenas "Gerar Nova LP" incrementa version)

---

## 9. Preview de Páginas Geradas

Dois modos de visualização:
- **iframe inline** — dentro do dashboard, re-renderiza ao confirmar edição de seção
- **Nova aba** — botão "↗ Abrir" abre a página completa no browser

Download disponível via botão "↓ Download" que entrega o arquivo `output.html`.

---

## 10. Classificação da Biblioteca

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `niche` | texto fixo/controlado | Infoproduto, SaaS, E-commerce, Saúde, etc. |
| `sub_niche` | dependente do niche | Copywriting, Fintech, Moda, Fitness, etc. |
| `page_type` | seleção | Vendas (long form), Webinar, Squeeze, VSL, Mentoria, etc. |
| `tags` | livres | dark, glassmorphism, urgência, countdown, serif, etc. |

---

## 11. Telas do Sistema

| Tela | Descrição |
|------|-----------|
| Dashboard | Métricas gerais, atividade recente, ações rápidas, cobertura da biblioteca por nicho |
| Projetos | Lista de projetos com status (rascunho / gerando / concluído), histórico de versões |
| Clientes | CRUD de clientes com nome e contato |
| Referências | Biblioteca filtrada por niche/sub_niche/page_type/tags, cards com thumbnail |
| Design Systems | Lista de DS cadastrados com status de extração |
| Gerador LP | Formulário de briefing → geração → preview → editor de seções |
| Configurações | API keys por provedor, modelo padrão por operação, prompts editáveis |

---

## 12. Configurações do Sistema

- **API Keys:** Anthropic (Claude), OpenAI (GPT-4o), extensível para outros provedores
- **Modelo padrão:** configurável separadamente para extração de DS e geração de LP
- **Prompt de extração:** editável (base: "Extract HTML Design System v2")
- **Prompt de geração:** editável (base inclui briefing + referências selecionadas)

---

## 13. Design Visual

**Estética:** Dark precision — brutalismo técnico com refinamento de agência criativa
**Fonte display:** Syne (geométrica, sharp)
**Fonte mono:** JetBrains Mono (dados, labels, código)
**Fonte corpo:** DM Sans
**Cor acento:** `#F0B429` (amber elétrico)
**Cor secundária:** `#00D4AA` (teal)
**Background:** `#07090F`
**Textura:** grain overlay sutil

---

## 14. Princípios

1. **A biblioteca é o núcleo** — qualidade da geração depende da riqueza da biblioteca
2. **A IA recombina, não inventa** — apenas classes e padrões existentes nas referências
3. **Automação total** — seleção de referências é automática, sem intervenção manual
4. **Escalabilidade implícita** — quanto mais referências adicionadas, melhor o sistema fica
