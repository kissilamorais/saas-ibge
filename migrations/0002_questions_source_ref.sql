-- Migration 0002 — coluna `source_ref` em questions.
-- Identificador estável vindo do conteúdo (.md): código da questão no banco
-- (ex.: ADM-F01) ou SIM-<arquivo>-<num> nos simulados. Permite que o seed de
-- questões seja idempotente (upsert por source_ref, sem duplicar em re-runs).

alter table public.questions
  add column if not exists source_ref text;

create unique index if not exists idx_questions_source_ref
  on public.questions(source_ref);
