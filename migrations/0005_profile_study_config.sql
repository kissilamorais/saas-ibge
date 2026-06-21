-- Migration 0005 — configuração de estudo por usuário.
-- Aplicar no banco que já rodou schema.sql + 0001..0004.
-- Idempotente.
--
-- Move para o banco o que estava hardcoded em dashboard/page.tsx:
--   - exam_date: data da prova (countdown da dashboard)
--   - daily_goal_hours / weekly_goal_hours: metas de estudo
-- Editáveis pelo próprio usuário em /dashboard/settings (RLS: update own profile).

begin;

alter table public.profiles
  add column if not exists exam_date date,
  add column if not exists daily_goal_hours integer not null default 4,
  add column if not exists weekly_goal_hours integer not null default 25;

commit;
