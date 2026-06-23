-- Migration 0009 — policy de UPDATE em user_answers (fix do upsert).
-- Aplicar no banco que já rodou schema.sql + 0001..0008.
-- Idempotente. Cole no SQL Editor do Supabase.
--
-- Bug corrigido:
--   `lib/actions/study.ts` grava respostas com
--     upsert(..., { onConflict: 'user_id,question_id' })
--   que vira INSERT ... ON CONFLICT DO UPDATE. A migration 0004 criou a
--   constraint unique(user_id, question_id) para suportar esse upsert, mas
--   user_answers só tinha policies de SELECT e INSERT (schema.sql / 0001).
--   Sem policy de UPDATE, a 2ª resposta à mesma questão (refazer simulado,
--   refazer prática, questão repetida) cai no ramo de UPDATE e a RLS bloqueia
--   — quebrando a correção do simulado e o resultado da prática.
--
-- Também re-afirma (defensivo, idempotente) as policies de escrita de
-- user_progress, garantindo que "marcar lição como concluída" (upsert por
-- user_id,lesson_id) funcione mesmo se alguma policy não tiver sido aplicada.

begin;

-- ===========================================================================
-- 1. user_answers: + UPDATE (faltava — necessária para o upsert por questão).
-- ===========================================================================
drop policy if exists "Users can update their own answers" on public.user_answers;
create policy "Users can update their own answers"
  on public.user_answers for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ===========================================================================
-- 2. user_progress: re-afirma INSERT + UPDATE (defensivo; já vêm de 0001).
-- ===========================================================================
drop policy if exists "Users can insert their own progress" on public.user_progress;
create policy "Users can insert their own progress"
  on public.user_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own progress" on public.user_progress;
create policy "Users can update their own progress"
  on public.user_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

commit;

-- Verificação (opcional): deve listar UPDATE para user_answers e user_progress.
-- select tablename, cmd, policyname from pg_policies
--   where tablename in ('user_answers','user_progress') order by tablename, cmd;
