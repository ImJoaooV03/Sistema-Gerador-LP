alter table design_systems
  add column if not exists ds_html    text,
  add column if not exists status     text not null default 'pending'
    check (status in ('pending', 'processing', 'done', 'error')),
  add column if not exists error_msg  text;
