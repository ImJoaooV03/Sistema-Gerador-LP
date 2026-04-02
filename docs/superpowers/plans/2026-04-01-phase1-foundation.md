# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffolding completo do projeto — Next.js 14 + Supabase + Auth + schema do banco + layout base (sidebar + topbar) + rotas skeleton para todas as 7 seções.

**Architecture:** Monolito Next.js 14 App Router com TypeScript. Supabase gerencia banco (Postgres), storage e autenticação. Layout base usa um route group `(app)` protegido por middleware que redireciona para `/login` se não autenticado. Design tokens implementados como CSS custom properties + classes Tailwind customizadas.

**Tech Stack:** Next.js 14 (App Router), TypeScript, TailwindCSS, Shadcn/UI, Supabase (@supabase/ssr), Vitest, @testing-library/react

---

## Planos Subsequentes (escrever após cada fase ser concluída)

| Plano | Escopo | Pré-requisito |
|-------|--------|---------------|
| Phase 2 — Entity CRUD | Clientes + Projetos (formulários, listas, detail pages) | Phase 1 |
| Phase 3 — Library | Referências + Design Systems (listagem, filtros, upload ZIP) | Phase 2 |
| Phase 4 — DS Extraction Engine | Job system + AI call + extração + preview + confirm | Phase 3 |
| Phase 5 — LP Generation Engine | Seleção de refs + geração IA + parsing de seções | Phase 4 |
| Phase 6 — Preview + Section Editor | iframe preview + editor código + modo IA | Phase 5 |
| Phase 7 — Dashboard + Config | Métricas reais + settings + API keys + prompts editáveis | Phase 6 |

---

## File Structure

```
/
├── app/
│   ├── globals.css                      ← design tokens + grain overlay
│   ├── layout.tsx                       ← root layout (fontes Google)
│   ├── page.tsx                         ← redirect → /dashboard
│   ├── login/
│   │   └── page.tsx                     ← página de login (Supabase Auth)
│   └── (app)/
│       ├── layout.tsx                   ← shell: sidebar + topbar
│       ├── dashboard/page.tsx           ← métricas estáticas (Phase 7 as torna reais)
│       ├── projetos/page.tsx            ← skeleton (Phase 2)
│       ├── clientes/page.tsx            ← skeleton (Phase 2)
│       ├── referencias/page.tsx         ← skeleton (Phase 3)
│       ├── design-systems/page.tsx      ← skeleton (Phase 3)
│       ├── gerador/page.tsx             ← skeleton (Phase 5)
│       └── configuracoes/page.tsx       ← skeleton (Phase 7)
├── components/
│   └── layout/
│       ├── sidebar.tsx                  ← sidebar com nav ativa
│       └── topbar.tsx                   ← topbar com título dinâmico
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    ← browser client
│   │   └── server.ts                    ← server client (RSC + API routes)
│   ├── types.ts                         ← tipos TypeScript das entidades do DB
│   └── utils.ts                         ← cn() + helpers gerais
├── supabase/
│   └── migrations/
│       └── 20260401000000_initial_schema.sql
├── middleware.ts                         ← proteção de rotas Auth
├── tailwind.config.ts                    ← tokens de design
├── vitest.config.ts
└── __tests__/
    ├── lib/utils.test.ts
    └── components/layout/sidebar.test.tsx
```

---

## Task 1: Inicializar projeto Next.js

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.local.example`

- [ ] **Step 1.1: Criar projeto**

```bash
cd "/Applications/Claude/Sistema - LP"
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

Quando perguntado, responder `No` para Turbopack (usar webpack padrão por estabilidade).

- [ ] **Step 1.2: Instalar dependências**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install class-variance-authority clsx tailwind-merge
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 1.3: Instalar Shadcn**

```bash
npx shadcn@latest init
```

Responder:
- Style: `Default`
- Base color: `Slate`
- CSS variables: `Yes`

Depois instalar os componentes que serão usados na Phase 1:

```bash
npx shadcn@latest add button input label card
```

- [ ] **Step 1.4: Criar `.env.local.example`**

Criar o arquivo `/Applications/Claude/Sistema - LP/.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 1.5: Criar `.env.local` com as credenciais reais do projeto Supabase**

Copiar `.env.local.example` para `.env.local` e preencher com as credenciais do painel do Supabase (Settings → API).

- [ ] **Step 1.6: Verificar que o projeto inicia**

```bash
npm run dev
```

Esperado: servidor rodando em `http://localhost:3000` sem erros no terminal.

- [ ] **Step 1.7: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 14 project with TypeScript, Tailwind, Shadcn"
```

---

## Task 2: Configurar Supabase Client

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/utils.ts`

- [ ] **Step 2.1: Criar `lib/utils.ts`**

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2.2: Criar `lib/supabase/client.ts`** (uso em Client Components)

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2.3: Criar `lib/supabase/server.ts`** (uso em Server Components e API Routes)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll em Server Components é ignorado se chamado fora de um Server Action
          }
        },
      },
    }
  )
}
```

- [ ] **Step 2.4: Criar `middleware.ts`** na raiz do projeto

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname === '/login'
  const isPublicAsset = request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon')

  if (isPublicAsset) return supabaseResponse

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2.5: Commit**

```bash
git add lib/ middleware.ts
git commit -m "feat: setup Supabase client (browser + server) and auth middleware"
```

---

## Task 3: Schema do banco de dados

**Files:**
- Create: `supabase/migrations/20260401000000_initial_schema.sql`
- Create: `lib/types.ts`

- [ ] **Step 3.1: Criar migration SQL**

Criar o arquivo `supabase/migrations/20260401000000_initial_schema.sql`:

```sql
-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- ── clientes ──────────────────────────────────────────────
create table clientes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  contato     text,
  created_at  timestamptz not null default now()
);

-- ── projetos ──────────────────────────────────────────────
create table projetos (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid references clientes(id) on delete cascade,
  nome        text not null,
  niche       text not null,
  sub_niche   text not null,
  page_type   text not null,
  briefing    text,
  created_at  timestamptz not null default now()
);

-- ── design_systems ────────────────────────────────────────
create table design_systems (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  storage_path  text not null,
  created_at    timestamptz not null default now()
);

-- ── referencias ───────────────────────────────────────────
create table referencias (
  id               uuid primary key default gen_random_uuid(),
  design_system_id uuid references design_systems(id) on delete set null,
  nome             text not null,
  niche            text not null,
  sub_niche        text,
  page_type        text,
  tags             text[] not null default '{}',
  observacoes      text,
  storage_path     text not null,
  created_at       timestamptz not null default now()
);

-- ── paginas_geradas ───────────────────────────────────────
create table paginas_geradas (
  id          uuid primary key default gen_random_uuid(),
  projeto_id  uuid references projetos(id) on delete cascade,
  html_output text,
  preview_url text,
  sections    jsonb not null default '[]',
  version     int  not null default 1,
  created_at  timestamptz not null default now()
);

-- ── jobs ──────────────────────────────────────────────────
create table jobs (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('ds_extraction', 'lp_generation')),
  status     text not null default 'pending'
               check (status in ('pending', 'running', 'done', 'error')),
  payload    jsonb not null default '{}',
  result     jsonb,
  error      text,
  created_at timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────
-- Ferramenta interna: qualquer usuário autenticado tem acesso total.
alter table clientes        enable row level security;
alter table projetos        enable row level security;
alter table design_systems  enable row level security;
alter table referencias     enable row level security;
alter table paginas_geradas enable row level security;
alter table jobs            enable row level security;

create policy "auth_all" on clientes        for all to authenticated using (true) with check (true);
create policy "auth_all" on projetos        for all to authenticated using (true) with check (true);
create policy "auth_all" on design_systems  for all to authenticated using (true) with check (true);
create policy "auth_all" on referencias     for all to authenticated using (true) with check (true);
create policy "auth_all" on paginas_geradas for all to authenticated using (true) with check (true);
create policy "auth_all" on jobs            for all to authenticated using (true) with check (true);
```

- [ ] **Step 3.2: Aplicar migration no Supabase**

No painel do Supabase → SQL Editor, colar e executar o conteúdo do arquivo acima.

Verificar no Table Editor que as 6 tabelas foram criadas: `clientes`, `projetos`, `design_systems`, `referencias`, `paginas_geradas`, `jobs`.

- [ ] **Step 3.3: Criar `lib/types.ts`** com os tipos TypeScript das entidades

```typescript
export type Cliente = {
  id: string
  nome: string
  contato: string | null
  created_at: string
}

export type Projeto = {
  id: string
  cliente_id: string | null
  nome: string
  niche: string
  sub_niche: string
  page_type: string
  briefing: string | null
  created_at: string
}

export type DesignSystem = {
  id: string
  nome: string
  storage_path: string
  created_at: string
}

export type Referencia = {
  id: string
  design_system_id: string | null
  nome: string
  niche: string
  sub_niche: string | null
  page_type: string | null
  tags: string[]
  observacoes: string | null
  storage_path: string
  created_at: string
}

export type PageSection = {
  id: string         // ex: "hero", "problema", "solucao"
  label: string      // ex: "Hero", "Problema", "Solução"
  html: string       // HTML da seção isolada
  order: number
}

export type PaginaGerada = {
  id: string
  projeto_id: string
  html_output: string | null
  preview_url: string | null
  sections: PageSection[]
  version: number
  created_at: string
}

export type JobType = 'ds_extraction' | 'lp_generation'
export type JobStatus = 'pending' | 'running' | 'done' | 'error'

export type Job = {
  id: string
  type: JobType
  status: JobStatus
  payload: Record<string, unknown>
  result: Record<string, unknown> | null
  error: string | null
  created_at: string
}
```

- [ ] **Step 3.4: Commit**

```bash
git add supabase/ lib/types.ts
git commit -m "feat: add database schema migration and TypeScript entity types"
```

---

## Task 4: Página de Login

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/page.tsx`

- [ ] **Step 4.1: Escrever teste para validação de email**

Criar `__tests__/lib/utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('resolves tailwind conflicts (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('ignores falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b')
  })
})
```

- [ ] **Step 4.2: Configurar Vitest**

Criar `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['__tests__/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

Criar `__tests__/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

Adicionar em `package.json` (dentro de `"scripts"`):

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4.3: Rodar o teste e verificar que passa**

```bash
npm run test:run
```

Esperado: `3 passed` em `utils.test.ts`.

- [ ] **Step 4.4: Criar `app/page.tsx`** (redirect para dashboard)

```typescript
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')
}
```

- [ ] **Step 4.5: Criar `app/login/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      {/* grain overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-40"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")" }}
      />

      <div className="w-full max-w-sm px-6 relative">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-[10px] bg-accent flex items-center justify-center font-syne font-extrabold text-sm text-bg-base shadow-[0_0_16px_rgba(240,180,41,0.3)]">
            LP
          </div>
          <div>
            <div className="font-syne font-bold text-text-1 tracking-tight">Sistema LP</div>
            <div className="text-[11px] text-text-3 font-mono">v1.0 · equipe</div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="font-syne font-bold text-2xl text-text-1 tracking-tight mb-1">Entrar</h1>
          <p className="text-text-2 text-sm">Acesso restrito à equipe</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-[10px] uppercase tracking-widest text-text-3 font-mono">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="voce@equipe.com"
              className="bg-surface border-border-default text-text-1 placeholder:text-text-3 focus:border-accent/40 focus-visible:ring-0"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-[10px] uppercase tracking-widest text-text-3 font-mono">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="bg-surface border-border-default text-text-1 placeholder:text-text-3 focus:border-accent/40 focus-visible:ring-0"
            />
          </div>

          {error && (
            <p className="text-[#FF4757] text-sm font-mono">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-bg-base font-semibold hover:bg-accent/90 hover:shadow-[0_0_18px_rgba(240,180,41,0.25)] mt-2"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4.6: Testar login manualmente**

```bash
npm run dev
```

1. Acessar `http://localhost:3000` — deve redirecionar para `/login`
2. Tentar acessar `http://localhost:3000/dashboard` sem login — deve redirecionar para `/login`
3. Fazer login com credenciais válidas do Supabase — deve redirecionar para `/dashboard` (404 por enquanto)

- [ ] **Step 4.7: Commit**

```bash
git add app/ __tests__/ vitest.config.ts
git commit -m "feat: add login page with Supabase auth and middleware protection"
```

---

## Task 5: Design Tokens + Tailwind Config

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 5.1: Substituir `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './__tests__/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base':   '#07090F',
        'surface':   '#0C1018',
        'elevated':  '#131A24',
        'overlay':   '#1A2332',
        'accent':    '#F0B429',
        'teal':      '#00D4AA',
        'purple':    '#A78BFA',
        'blue-lp':   '#60A5FA',
        'red-lp':    '#FF4757',
        'text-1':    '#EDF2F7',
        'text-2':    '#8896A8',
        'text-3':    '#4A5568',
      },
      borderColor: {
        DEFAULT:       '#1E2B3C',
        'border-default': '#1E2B3C',
        'border-hi':   '#263648',
      },
      backgroundColor: {
        'accent-dim': 'rgba(240,180,41,0.10)',
        'teal-dim':   'rgba(0,212,170,0.10)',
      },
      boxShadow: {
        'accent-glow': '0 0 16px rgba(240,180,41,0.22)',
        'teal-glow':   '0 0 6px rgba(0,212,170,0.60)',
      },
      width: {
        sidebar: '224px',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5.2: Substituir `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Google Fonts ── */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap');

@layer base {
  * {
    @apply border-border-default;
    box-sizing: border-box;
  }

  html, body {
    @apply bg-bg-base text-text-1 font-sans;
    height: 100%;
  }

  /* Grain overlay global */
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
    opacity: 0.45;
  }

  /* Scrollbar sutil */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1E2B3C; border-radius: 2px; }
}
```

- [ ] **Step 5.3: Atualizar `app/layout.tsx`** (root layout)

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sistema LP',
  description: 'Gerador de landing pages com IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 5.4: Verificar que o projeto compila sem erros**

```bash
npm run build
```

Esperado: build concluído sem erros de TypeScript ou Tailwind.

- [ ] **Step 5.5: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx
git commit -m "feat: implement design tokens (Syne/JetBrains Mono/DM Sans, amber accent, dark theme)"
```

---

## Task 6: App Layout — Sidebar + Topbar

**Files:**
- Create: `components/layout/sidebar.tsx`
- Create: `components/layout/topbar.tsx`
- Create: `app/(app)/layout.tsx`
- Create: `__tests__/components/layout/sidebar.test.tsx`

- [ ] **Step 6.1: Escrever teste para sidebar**

Criar `__tests__/components/layout/sidebar.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { signOut: vi.fn() },
  })),
}))

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

describe('Sidebar', () => {
  it('renders all navigation items', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard')
    render(<Sidebar />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Projetos')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Referências')).toBeInTheDocument()
    expect(screen.getByText('Design Systems')).toBeInTheDocument()
    expect(screen.getByText('Gerador LP')).toBeInTheDocument()
    expect(screen.getByText('Configurações')).toBeInTheDocument()
  })

  it('marks the current route as active', () => {
    vi.mocked(usePathname).mockReturnValue('/referencias')
    render(<Sidebar />)

    const refLink = screen.getByText('Referências').closest('a')
    expect(refLink).toHaveClass('bg-accent-dim')
  })

  it('does not mark other routes as active', () => {
    vi.mocked(usePathname).mockReturnValue('/referencias')
    render(<Sidebar />)

    const dashLink = screen.getByText('Dashboard').closest('a')
    expect(dashLink).not.toHaveClass('bg-accent-dim')
  })
})
```

- [ ] **Step 6.2: Rodar o teste — verificar que falha**

```bash
npm run test:run
```

Esperado: FAIL — `Cannot find module '@/components/layout/sidebar'`

- [ ] **Step 6.3: Criar `components/layout/sidebar.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard',      icon: '⬡', label: 'Dashboard',      badge: null },
      { href: '/projetos',       icon: '◧', label: 'Projetos',        badge: '0'  },
      { href: '/clientes',       icon: '◎', label: 'Clientes',        badge: null },
    ],
  },
  {
    label: 'Biblioteca',
    items: [
      { href: '/referencias',    icon: '◈', label: 'Referências',     badge: '0'  },
      { href: '/design-systems', icon: '◉', label: 'Design Systems',  badge: '0'  },
    ],
  },
  {
    label: 'Ferramenta',
    items: [
      { href: '/gerador',        icon: '⚡', label: 'Gerador LP',      badge: null },
      { href: '/configuracoes',  icon: '◌', label: 'Configurações',   badge: null },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-sidebar flex-shrink-0 bg-surface border-r border-border-default flex flex-col h-full">
      {/* Logo */}
      <div className="px-[18px] pt-[22px] pb-[18px] border-b border-border-default flex items-center gap-3">
        <div className="w-9 h-9 rounded-[9px] bg-accent flex items-center justify-center font-syne font-extrabold text-[13px] text-bg-base shadow-accent-glow flex-shrink-0">
          LP
        </div>
        <div>
          <div className="font-syne text-[15px] font-bold tracking-tight text-text-1 leading-tight">
            Sistema LP
          </div>
          <div className="text-[10px] text-text-3 font-mono tracking-wide mt-0.5">
            v1.0 · equipe
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3.5 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="text-[9px] uppercase tracking-[1.8px] text-text-3 font-mono px-2.5 py-1 mt-3 first:mt-0 mb-0.5">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-[9px] rounded-lg text-[13px] transition-all duration-150 relative border',
                    isActive
                      ? 'bg-accent-dim text-accent border-accent/20 font-medium'
                      : 'text-text-2 border-transparent hover:bg-elevated hover:text-text-1'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-sm bg-accent" />
                  )}
                  <span className="w-[17px] text-center text-[13px] flex-shrink-0">
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== null && (
                    <span className="bg-overlay text-text-3 text-[10px] font-mono px-1.5 py-0.5 rounded-lg border border-border-default">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer: modelo ativo */}
      <div className="p-2.5 border-t border-border-default">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-elevated border border-border-default cursor-pointer hover:border-border-hi transition-colors">
          <div className="w-1.5 h-1.5 rounded-full bg-teal shadow-teal-glow flex-shrink-0" />
          <span className="text-text-2 font-mono text-[11px] flex-1">claude-opus-4</span>
          <button
            onClick={handleSignOut}
            className="text-text-3 text-[10px] hover:text-text-2 transition-colors"
            title="Sair"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 6.4: Criar `components/layout/topbar.tsx`**

```typescript
'use client'

import { usePathname } from 'next/navigation'

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  '/dashboard':      { title: 'Dashboard',       crumb: 'visão geral'      },
  '/projetos':       { title: 'Projetos',         crumb: '0 projetos'       },
  '/clientes':       { title: 'Clientes',         crumb: 'gestão'           },
  '/referencias':    { title: 'Referências',      crumb: 'biblioteca'       },
  '/design-systems': { title: 'Design Systems',   crumb: 'biblioteca'       },
  '/gerador':        { title: 'Gerador LP',        crumb: 'nova landing page'},
  '/configuracoes':  { title: 'Configurações',    crumb: 'sistema'          },
}

function getPageMeta(pathname: string) {
  // Match por prefixo (ex: /projetos/[id] → /projetos)
  const match = Object.keys(PAGE_META)
    .sort((a, b) => b.length - a.length)
    .find(key => pathname.startsWith(key))
  return match ? PAGE_META[match] : { title: 'Sistema LP', crumb: '' }
}

export function Topbar() {
  const pathname = usePathname()
  const { title, crumb } = getPageMeta(pathname)

  return (
    <header className="h-[77px] flex-shrink-0 bg-surface border-b border-border-default flex items-center px-7 gap-4">
      <span className="font-syne text-[15px] font-bold tracking-tight text-text-1">
        {title}
      </span>
      <div className="w-px h-3.5 bg-border-default" />
      <span className="text-[11px] text-text-3 font-mono">{crumb}</span>
      <div id="topbar-actions" className="ml-auto flex items-center gap-2" />
    </header>
  )
}
```

- [ ] **Step 6.5: Criar `app/(app)/layout.tsx`**

```typescript
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-7">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 6.6: Rodar os testes — verificar que passam**

```bash
npm run test:run
```

Esperado: `6 passed` (3 utils + 3 sidebar).

- [ ] **Step 6.7: Commit**

```bash
git add components/ app/\(app\)/layout.tsx __tests__/
git commit -m "feat: add sidebar and topbar layout components with active route state"
```

---

## Task 7: Route Skeleton — Todas as 7 seções

**Files:**
- Create: `app/(app)/dashboard/page.tsx`
- Create: `app/(app)/projetos/page.tsx`
- Create: `app/(app)/clientes/page.tsx`
- Create: `app/(app)/referencias/page.tsx`
- Create: `app/(app)/design-systems/page.tsx`
- Create: `app/(app)/gerador/page.tsx`
- Create: `app/(app)/configuracoes/page.tsx`

- [ ] **Step 7.1: Criar componente `EmptyState`** reutilizável

Criar `components/shared/empty-state.tsx`:

```typescript
type EmptyStateProps = {
  icon: string
  title: string
  description: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <span className="text-4xl opacity-20">{icon}</span>
      <span className="font-syne text-[17px] font-bold text-text-2">{title}</span>
      <span className="text-[12px] text-text-3 font-mono">{description}</span>
    </div>
  )
}
```

- [ ] **Step 7.2: Criar páginas skeleton**

`app/(app)/projetos/page.tsx`:
```typescript
import { EmptyState } from '@/components/shared/empty-state'
export default function ProjetosPage() {
  return <EmptyState icon="◧" title="Projetos" description="Implementado na Phase 2" />
}
```

`app/(app)/clientes/page.tsx`:
```typescript
import { EmptyState } from '@/components/shared/empty-state'
export default function ClientesPage() {
  return <EmptyState icon="◎" title="Clientes" description="Implementado na Phase 2" />
}
```

`app/(app)/referencias/page.tsx`:
```typescript
import { EmptyState } from '@/components/shared/empty-state'
export default function ReferenciasPage() {
  return <EmptyState icon="◈" title="Referências" description="Implementado na Phase 3" />
}
```

`app/(app)/design-systems/page.tsx`:
```typescript
import { EmptyState } from '@/components/shared/empty-state'
export default function DesignSystemsPage() {
  return <EmptyState icon="◉" title="Design Systems" description="Implementado na Phase 3" />
}
```

`app/(app)/gerador/page.tsx`:
```typescript
import { EmptyState } from '@/components/shared/empty-state'
export default function GeradorPage() {
  return <EmptyState icon="⚡" title="Gerador LP" description="Implementado na Phase 5" />
}
```

`app/(app)/configuracoes/page.tsx`:
```typescript
import { EmptyState } from '@/components/shared/empty-state'
export default function ConfiguracoesPage() {
  return <EmptyState icon="◌" title="Configurações" description="Implementado na Phase 7" />
}
```

- [ ] **Step 7.3: Verificar navegação completa**

```bash
npm run dev
```

1. Fazer login
2. Verificar que cada item do nav navega para a rota correta
3. Verificar que o item ativo fica destacado em amber no sidebar
4. Verificar que o título no topbar muda conforme a rota

- [ ] **Step 7.4: Commit**

```bash
git add app/\(app\)/ components/shared/
git commit -m "feat: add route skeleton for all 7 sections with active nav state"
```

---

## Task 8: Dashboard Page

**Files:**
- Create: `app/(app)/dashboard/page.tsx`
- Create: `components/dashboard/stat-card.tsx`
- Create: `components/dashboard/activity-feed.tsx`

- [ ] **Step 8.1: Criar `components/dashboard/stat-card.tsx`**

```typescript
import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: string | number
  delta: string
  color: 'amber' | 'teal' | 'purple' | 'blue'
}

const colorMap = {
  amber:  { value: 'text-accent',   glow: 'after:bg-accent'   },
  teal:   { value: 'text-teal',     glow: 'after:bg-teal'     },
  purple: { value: 'text-purple',   glow: 'after:bg-purple'   },
  blue:   { value: 'text-blue-lp',  glow: 'after:bg-blue-lp'  },
}

export function StatCard({ label, value, delta, color }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div
      className={cn(
        'bg-elevated border border-border-default rounded-xl p-5 relative overflow-hidden',
        'hover:border-border-hi hover:-translate-y-px transition-all duration-200 cursor-default',
        'after:content-[""] after:absolute after:-top-5 after:-right-5',
        'after:w-20 after:h-20 after:rounded-full after:opacity-[0.07]',
        c.glow
      )}
    >
      <div className="text-[10px] uppercase tracking-[1.2px] text-text-3 font-mono mb-2.5">
        {label}
      </div>
      <div className={cn('font-syne text-[34px] font-extrabold tracking-[-1.5px] leading-none mb-1.5', c.value)}>
        {value}
      </div>
      <div className="text-[11px] text-text-3">{delta}</div>
    </div>
  )
}
```

- [ ] **Step 8.2: Criar `components/dashboard/activity-feed.tsx`**

```typescript
import { cn } from '@/lib/utils'

type ActivityItem = {
  id: string
  name: string
  detail: string
  time: string
  status: 'success' | 'processing' | 'info'
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', name: 'LP gerada — Curso de Inglês Online',    detail: 'infoproduto · curso online · GPT-4o',    time: '2h',   status: 'success'    },
  { id: '2', name: 'Extraindo Design System — Hotmart Dark', detail: 'processando · claude-opus-4',             time: '5min', status: 'processing' },
  { id: '3', name: 'Nova referência — Guru Dark',           detail: 'infoproduto · vendas · dark mode',        time: '3h',   status: 'info'       },
  { id: '4', name: 'LP gerada — Software de Gestão B2B',   detail: 'saas · b2b · claude-opus-4',              time: '5h',   status: 'success'    },
  { id: '5', name: 'LP gerada — Academia de Nutrição',     detail: 'saúde · fitness · GPT-4o',                time: '8h',   status: 'success'    },
]

const dotClass: Record<string, string> = {
  success:    'bg-teal shadow-teal-glow',
  processing: 'bg-accent shadow-accent-glow animate-pulse',
  info:       'bg-blue-lp',
}

export function ActivityFeed() {
  return (
    <div className="bg-elevated border border-border-default rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border-default flex items-center justify-between">
        <span className="font-syne text-[13px] font-bold tracking-tight text-text-1">Atividade Recente</span>
        <span className="text-[10px] text-text-3 font-mono">últimas 24h</span>
      </div>
      <div className="px-5">
        {MOCK_ACTIVITY.map((item) => (
          <div key={item.id} className="flex items-start gap-3 py-3 border-b border-border-default last:border-0">
            <div className={cn('w-[7px] h-[7px] rounded-full mt-[5px] flex-shrink-0', dotClass[item.status])} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-text-1 truncate">{item.name}</div>
              <div className="text-[11px] text-text-3 font-mono">{item.detail}</div>
            </div>
            <div className="text-[10px] text-text-3 font-mono flex-shrink-0 mt-0.5">{item.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 8.3: Criar `app/(app)/dashboard/page.tsx`**

```typescript
import { StatCard } from '@/components/dashboard/stat-card'
import { ActivityFeed } from '@/components/dashboard/activity-feed'

const QUICK_ACTIONS = [
  { icon: '⚡', title: 'Gerar Nova LP',        desc: 'a partir de briefing', href: '/gerador'       },
  { icon: '📦', title: 'Adicionar Referência', desc: 'upload de ZIP',        href: '/referencias'   },
  { icon: '🎨', title: 'Extrair Design System', desc: 'de página existente', href: '/design-systems' },
]

const LIBRARY_COVERAGE = [
  { label: 'Infoproduto', count: 0, pct: 0,  color: '#F0B429' },
  { label: 'SaaS',        count: 0, pct: 0,  color: '#00D4AA' },
  { label: 'E-commerce',  count: 0, pct: 0,  color: '#A78BFA' },
  { label: 'Saúde',       count: 0, pct: 0,  color: '#60A5FA' },
]

export default function DashboardPage() {
  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="projetos ativos"  value={0}  delta="nenhum ainda"    color="amber"  />
        <StatCard label="referências"      value={0}  delta="nenhuma ainda"   color="teal"   />
        <StatCard label="design systems"   value={0}  delta="nenhum ainda"    color="purple" />
        <StatCard label="lps geradas"      value={0}  delta="nenhuma ainda"   color="blue"   />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_320px] gap-4">
        <ActivityFeed />

        <div className="flex flex-col gap-4">
          {/* Quick Actions */}
          <div className="bg-elevated border border-border-default rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border-default">
              <span className="font-syne text-[13px] font-bold tracking-tight text-text-1">Ações Rápidas</span>
            </div>
            <div className="p-3">
              {QUICK_ACTIONS.map((action) => (
                <a
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border-default bg-surface mb-2 last:mb-0 hover:border-accent/35 hover:bg-accent-dim transition-all duration-150 group"
                >
                  <span className="text-[17px] flex-shrink-0">{action.icon}</span>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-text-1">{action.title}</div>
                    <div className="text-[11px] text-text-3">{action.desc}</div>
                  </div>
                  <span className="text-text-3 text-[11px] group-hover:text-accent transition-colors">→</span>
                </a>
              ))}
            </div>
          </div>

          {/* Library Coverage */}
          <div className="bg-elevated border border-border-default rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border-default">
              <span className="font-syne text-[13px] font-bold tracking-tight text-text-1">Cobertura da Biblioteca</span>
            </div>
            <div className="px-4 py-4 flex flex-col gap-3">
              {LIBRARY_COVERAGE.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[11px] text-text-2 font-mono">{item.label}</span>
                    <span className="text-[11px] font-mono" style={{ color: item.color }}>{item.count} refs</span>
                  </div>
                  <div className="h-[3px] bg-border-default rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%`, background: item.color }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-text-3 font-mono mt-1">
                Adicione referências para ver a cobertura
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 8.4: Verificar dashboard visualmente**

```bash
npm run dev
```

Acessar `http://localhost:3000/dashboard` e verificar:
- 4 stat cards na primeira linha (valores 0 por enquanto)
- Feed de atividade com dados mockados
- Ações rápidas funcionando como links
- Cobertura da biblioteca com barras zeradas

- [ ] **Step 8.5: Rodar todos os testes**

```bash
npm run test:run
```

Esperado: todos os testes passam.

- [ ] **Step 8.6: Build final de verificação**

```bash
npm run build
```

Esperado: build sem erros.

- [ ] **Step 8.7: Commit final**

```bash
git add app/\(app\)/dashboard/ components/dashboard/ components/shared/
git commit -m "feat: complete Phase 1 foundation — auth, layout, schema, dashboard skeleton"
```

---

## Checklist de Conclusão da Phase 1

Antes de iniciar a Phase 2, verificar:

- [ ] Login com Supabase Auth funcionando
- [ ] Middleware redirecionando corretamente (sem auth → `/login`)
- [ ] Todas as 7 rotas acessíveis após login
- [ ] Sidebar com item ativo correto em cada rota
- [ ] Topbar com altura alinhada à sidebar (77px)
- [ ] Design tokens (amber accent, fontes Syne/JetBrains/DM Sans) aplicados
- [ ] 6 tabelas criadas no Supabase com RLS ativo
- [ ] Build sem erros de TypeScript
- [ ] Todos os testes passando
