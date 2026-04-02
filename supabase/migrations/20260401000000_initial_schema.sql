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
  cliente_id  uuid not null references clientes(id) on delete cascade,
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
  projeto_id  uuid not null references projetos(id) on delete cascade,
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
