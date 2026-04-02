-- Adiciona status ao projeto (rascunho padrão; gerando/concluido serão usados nas Phases 4/5)
alter table projetos
  add column if not exists status text not null default 'rascunho'
  check (status in ('rascunho', 'gerando', 'concluido'));
