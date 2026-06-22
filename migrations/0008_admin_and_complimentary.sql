-- ============================================================================
-- 0008 — Painel de administrador: role de admin, acesso de cortesia (parceiro),
-- captura de origem (UTM) do lead e gate de conteúdo unificado.
-- Cole no SQL Editor do Supabase e rode. Idempotente.
-- Pré-requisito: schema.sql + 0001..0005 + 0007 já aplicados.
-- (Não existe 0006 — vão intencional no histórico.)
--
-- Resolve:
--   1. Não havia role de admin em lugar nenhum → coluna profiles.is_admin +
--      private.is_admin() (checagem no servidor / RLS).
--   2. Acesso de parceiro grátis: tabela complimentary_access (por e-mail, com
--      validade e revogação). Cortesia casa por e-mail → vale mesmo se concedida
--      ANTES de a pessoa se cadastrar (o gate faz o join em tempo real).
--   3. Gate de conteúdo unificado: assinatura ativa OU cortesia válida.
--   4. Origem do lead (utm_source/medium/campaign) capturada no signup.
--   5. Follow-up de lead (status + nota) para o CRM básico do admin.
-- ============================================================================
begin;

-- ===========================================================================
-- 1. Role de admin
-- ===========================================================================
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = (select auth.uid())),
    false
  );
$$;

revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- Admin NÃO é semeado aqui por e-mail hardcoded. Quem é admin vem da allowlist
-- em env (ADMIN_EMAILS), verificada no servidor; requireAdmin() promove
-- is_admin=true no 1º acesso ao /admin (via service_role). Veja src/lib/auth/admin.ts.
-- Cleanup de um seed hardcoded anterior, caso esta migration já tenha rodado:
update public.profiles
  set is_admin = false
  where lower(email) = lower('kissilamorais01@gmail.com');

-- ===========================================================================
-- 2. Origem (UTM) do lead + follow-up
-- ===========================================================================
alter table public.profiles
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists lead_followup_status text not null default 'none',
  add column if not exists lead_followup_note text,
  add column if not exists lead_followup_at timestamp with time zone;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_lead_followup_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_lead_followup_status_check
      check (lead_followup_status in ('none', 'contacted', 'converted', 'lost'));
  end if;
end$$;

-- ===========================================================================
-- 2b. Blindagem contra escalada de privilégio.
--     A policy "Users can update their own profile" deixa o usuário atualizar
--     QUALQUER coluna da própria linha. Sem isto, ele poderia setar o próprio
--     is_admin=true (ou mexer no follow-up/UTM). Revogamos o UPDATE dessas
--     colunas sensíveis de anon/authenticated — só o service_role (servidor)
--     as altera. O resto do profile o usuário segue editando normalmente.
-- ===========================================================================
revoke update (
  is_admin,
  lead_followup_status,
  lead_followup_note,
  lead_followup_at,
  utm_source,
  utm_medium,
  utm_campaign
) on public.profiles from anon, authenticated;

-- ===========================================================================
-- 3. Cortesia de parceiro (acesso grátis concedido pelo admin)
--    unique parcial: um único registro ATIVO por e-mail (re-conceder após
--    revogar é permitido). Casado por lower(email).
-- ===========================================================================
create table if not exists public.complimentary_access (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  note text,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamp with time zone not null default timezone('utc'::text, now()),
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone
);

create unique index if not exists idx_comp_access_email_active
  on public.complimentary_access (lower(email))
  where revoked_at is null;
create index if not exists idx_comp_access_email
  on public.complimentary_access (lower(email));

alter table public.complimentary_access enable row level security;

-- Só admin gerencia via cliente autenticado. O service_role (admin client do
-- servidor) ignora RLS — é o caminho usado pelas server actions do painel.
drop policy if exists "Admins manage complimentary access" on public.complimentary_access;
create policy "Admins manage complimentary access"
  on public.complimentary_access for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ===========================================================================
-- 4. Gate de conteúdo unificado: assinatura ativa OU cortesia válida.
--    has_active_subscription() (já referenciada por TODAS as policies de
--    conteúdo desde a 0001) passa a delegar para has_content_access() — assim
--    nenhuma policy precisa ser reescrita.
-- ===========================================================================
create or replace function private.has_content_access()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.subscription_status = 'active'
    )
    or exists (
      select 1
      from public.profiles p
      join public.complimentary_access c on lower(c.email) = lower(p.email)
      where p.id = (select auth.uid())
        and c.revoked_at is null
        and (c.expires_at is null or c.expires_at > timezone('utc'::text, now()))
    );
$$;

revoke execute on function private.has_content_access() from public, anon;
grant execute on function private.has_content_access() to authenticated;

create or replace function private.has_active_subscription()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select private.has_content_access();
$$;

revoke execute on function private.has_active_subscription() from public, anon;
grant execute on function private.has_active_subscription() to authenticated;

-- Wrapper PÚBLICO (chamável via PostgREST/rpc) para o app conferir o acesso do
-- usuário logado no servidor (decisões de redirect) usando EXATAMENTE a mesma
-- regra do RLS — sem precisar dar SELECT em complimentary_access ao usuário.
create or replace function public.current_user_has_content_access()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select private.has_content_access();
$$;

revoke execute on function public.current_user_has_content_access() from public, anon;
grant execute on function public.current_user_has_content_access() to authenticated;

-- ===========================================================================
-- 5. handle_new_user(): grava também a origem (UTM) vinda do signup.
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, utm_source, utm_medium, utm_campaign)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'utm_source',
    new.raw_user_meta_data->>'utm_medium',
    new.raw_user_meta_data->>'utm_campaign'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

commit;

-- ====================== VERIFICAÇÃO (opcional) =============================
select 'profiles.is_admin' as check, count(*) from information_schema.columns
  where table_schema='public' and table_name='profiles' and column_name='is_admin'; -- 1
select 'complimentary_access' as check, count(*) from information_schema.tables
  where table_schema='public' and table_name='complimentary_access'; -- 1
select 'admin seeded' as check, count(*) from public.profiles where is_admin; -- >=0 (1 se já tiver conta)
