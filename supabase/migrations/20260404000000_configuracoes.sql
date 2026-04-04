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

INSERT INTO configuracoes (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE configuracoes DISABLE ROW LEVEL SECURITY;
