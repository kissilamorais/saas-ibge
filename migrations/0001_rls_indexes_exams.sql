-- Migration 0001 — correções de RLS, índices e vínculo exam<->questions.
-- Aplicar no banco que JÁ rodou schema.sql (cole no SQL Editor do Supabase).
-- Idempotente: usa `if not exists` / `drop policy if exists` + `create`.
--
-- Resolve:
--   1. Tabelas de conteúdo (questions/question_options/exams) sem policy = nega tudo.
--   2. Falta de vínculo exam<->questions (TODO em queries.ts).
--   3. RLS lento: auth.uid() chamado por linha -> (select auth.uid()) + helper.
--   4. Índices de FK ausentes.
--   5. Policies de escrita ausentes (user_progress INSERT, user_exam_results INSERT).
--   6. Criação automática de profile no signup (trigger).

begin;

-- ===========================================================================
-- 1. Schema privado + helper de assinatura (security definer)
-- Centraliza o gate de assinatura em UMA função indexada, em vez de uma
-- subquery correlacionada por linha dentro de cada policy.
-- ===========================================================================
create schema if not exists private;

create or replace function private.has_active_subscription()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and subscription_status = 'active'
  );
$$;

-- Só o servidor/policies chamam; tira execução direta de quem não deve.
revoke execute on function private.has_active_subscription() from public, anon;
-- ...mas authenticated PRECISA executar (o RLS roda a função no contexto dele).
grant usage on schema private to authenticated;
grant execute on function private.has_active_subscription() to authenticated;

-- ===========================================================================
-- 2. Vínculo exams <-> questions (tabela de junção; questões reutilizáveis)
-- ===========================================================================
create table if not exists public.exam_questions (
  id uuid default gen_random_uuid() primary key,
  exam_id uuid references public.exams(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  order_index integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (exam_id, question_id)
);

alter table public.exam_questions enable row level security;

-- ===========================================================================
-- 3. Índices (FK + junção). FK não são indexadas automaticamente no Postgres.
-- ===========================================================================
create index if not exists idx_questions_lesson_id           on public.questions(lesson_id);
create index if not exists idx_question_options_question_id   on public.question_options(question_id);
create index if not exists idx_user_progress_module_id        on public.user_progress(module_id);
create index if not exists idx_user_answers_question_id       on public.user_answers(question_id);
create index if not exists idx_user_answers_selected_option   on public.user_answers(selected_option_id);
create index if not exists idx_study_sessions_module_id       on public.study_sessions(module_id);
create index if not exists idx_study_sessions_lesson_id       on public.study_sessions(lesson_id);
create index if not exists idx_user_exam_results_exam_id      on public.user_exam_results(exam_id);
create index if not exists idx_exam_questions_exam_id         on public.exam_questions(exam_id);
create index if not exists idx_exam_questions_question_id     on public.exam_questions(question_id);

-- ===========================================================================
-- 4. RLS — reescrita de TODAS as policies:
--    - (select auth.uid()) em vez de auth.uid() cru (cacheado por query)
--    - `to authenticated` explícito
--    - policies de SELECT para tabelas de conteúdo (estavam ausentes!)
--    - INSERT faltantes (progresso, resultado de simulado)
-- ===========================================================================

-- profiles
drop policy if exists "Users can view their own profile"   on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- modules: catálogo visível a qualquer autenticado (browse antes de pagar)
drop policy if exists "Public modules are visible to authenticated users" on public.modules;
create policy "Modules visible to authenticated"
  on public.modules for select to authenticated
  using (true);

-- lessons: conteúdo exige assinatura ativa
drop policy if exists "Public lessons are visible to authenticated users with active subscription" on public.lessons;
create policy "Lessons require active subscription"
  on public.lessons for select to authenticated
  using ((select private.has_active_subscription()));

-- questions / question_options / exams / exam_questions: exigem assinatura (ANTES sem policy)
create policy "Questions require active subscription"
  on public.questions for select to authenticated
  using ((select private.has_active_subscription()));
create policy "Question options require active subscription"
  on public.question_options for select to authenticated
  using ((select private.has_active_subscription()));
create policy "Exams require active subscription"
  on public.exams for select to authenticated
  using ((select private.has_active_subscription()));
create policy "Exam questions require active subscription"
  on public.exam_questions for select to authenticated
  using ((select private.has_active_subscription()));

-- user_progress: + INSERT (faltava) e with check no UPDATE
drop policy if exists "Users can view their own progress"   on public.user_progress;
drop policy if exists "Users can update their own progress" on public.user_progress;
create policy "Users can view their own progress"
  on public.user_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert their own progress"
  on public.user_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own progress"
  on public.user_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- user_answers
drop policy if exists "Users can view their own answers"   on public.user_answers;
drop policy if exists "Users can insert their own answers" on public.user_answers;
create policy "Users can view their own answers"
  on public.user_answers for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert their own answers"
  on public.user_answers for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- study_sessions
drop policy if exists "Users can view their own study sessions"   on public.study_sessions;
drop policy if exists "Users can insert their own study sessions" on public.study_sessions;
create policy "Users can view their own study sessions"
  on public.study_sessions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert their own study sessions"
  on public.study_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- user_exam_results: + INSERT (faltava — não salvava resultado)
drop policy if exists "Users can view exam results" on public.user_exam_results;
create policy "Users can view their own exam results"
  on public.user_exam_results for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can insert their own exam results"
  on public.user_exam_results for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- ===========================================================================
-- 5. Trigger: cria profile automaticamente no signup
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

commit;
