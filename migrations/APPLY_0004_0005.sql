-- ============================================================================
-- APPLY 0004 + 0005 — cole TUDO no SQL Editor do Supabase e rode.
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- Pré-requisito: schema.sql + 0001..0003 já aplicados.
-- ============================================================================

-- ====================== 0004: consolidação + dedupe ========================
begin;

-- 1. handle_new_user() canônico (security definer, search_path travado).
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

-- 2. Fallback: o usuário pode inserir o próprio profile (caso o trigger falhe).
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

-- 3. user_answers: dedupe (mantém a mais recente) + unique(user_id, question_id).
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

-- 4. stripe_events: idempotência do webhook.
create table if not exists public.stripe_events (
  id text primary key,
  type text,
  processed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.stripe_events enable row level security;

commit;

-- ====================== 0005: config de estudo =============================
begin;

alter table public.profiles
  add column if not exists exam_date date,
  add column if not exists daily_goal_hours integer not null default 4,
  add column if not exists weekly_goal_hours integer not null default 25;

commit;

-- ====================== VERIFICAÇÃO (opcional) =============================
-- Espera 1 linha cada:
select 'unique constraint' as check, count(*) from pg_constraint
  where conname = 'user_answers_user_question_unique';
select 'stripe_events table' as check, count(*) from information_schema.tables
  where table_schema = 'public' and table_name = 'stripe_events';
select 'profiles cols' as check, count(*) from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles'
    and column_name in ('exam_date','daily_goal_hours','weekly_goal_hours'); -- espera 3
