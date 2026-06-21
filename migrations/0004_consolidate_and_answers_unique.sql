-- Migration 0004 — consolidação + dedupe de respostas.
-- Aplicar no banco que já rodou schema.sql + 0001..0003.
-- Idempotente. Cole no SQL Editor do Supabase.
--
-- Resolve:
--   1. Versões divergentes de handle_new_user() (schema.sql / 0001 / supabase/auth-setup.sql).
--      Esta passa a ser a ÚNICA fonte de verdade. (Ignore supabase/*.sql — histórico.)
--   2. Policy de INSERT em profiles (fallback do trigger), padronizada com (select auth.uid()).
--   3. user_answers crescendo sem limite: dedupe + unique(user_id, question_id)
--      para suportar upsert "última resposta por questão" (ver lib/actions/study.ts).

begin;

-- ===========================================================================
-- 1. handle_new_user() canônico (security definer, search_path travado).
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

-- ===========================================================================
-- 2. Fallback: o usuário pode inserir o próprio profile (caso o trigger falhe).
-- ===========================================================================
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

-- ===========================================================================
-- 3. user_answers: dedupe (mantém a resposta mais recente por questão) e
--    constraint única para o upsert por (user_id, question_id).
-- ===========================================================================
delete from public.user_answers a
using public.user_answers b
where a.user_id = b.user_id
  and a.question_id = b.question_id
  and (
    a.attempted_at < b.attempted_at
    or (a.attempted_at = b.attempted_at and a.ctid < b.ctid)
  );

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_answers_user_question_unique'
  ) then
    alter table public.user_answers
      add constraint user_answers_user_question_unique
      unique (user_id, question_id);
  end if;
end$$;

-- ===========================================================================
-- 4. stripe_events: idempotência do webhook (cada event.id processado 1x só).
--    Acessada apenas pelo service_role (webhook). RLS ligada sem policies =
--    nega acesso a anon/authenticated.
-- ===========================================================================
create table if not exists public.stripe_events (
  id text primary key,
  type text,
  processed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.stripe_events enable row level security;

commit;
