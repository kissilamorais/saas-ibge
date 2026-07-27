-- 0012 — Teste gratuito (free trial): captura de lead + resultado do diagnóstico.
-- Aplicar no banco que já rodou schema.sql + 0001..0011.
-- Idempotente. Cole no SQL Editor do Supabase.
--
-- Contexto:
--   O teste gratuito é um funil de topo: o visitante cria conta, escolhe o cargo,
--   responde 10 questões e vê um diagnóstico. Não dá acesso ao conteúdo pago —
--   o gate de RLS (private.has_content_access) continua intacto e inalterado.
--
--   profiles.whatsapp     → contato do lead (follow-up comercial).
--   profiles.is_trial     → marca a conta como originada do teste gratuito.
--   profiles.trial_cargo  → cargo escolhido, usado para segmentar o resultado.
--   free_trial_results    → uma linha por teste concluído.

begin;

-- ===========================================================================
-- 1. Colunas novas em profiles
--    NB: nenhuma entra no revoke de 0008 (blindagem de escalada) — são dados
--    do próprio usuário e não concedem privilégio algum. O acesso ao conteúdo
--    segue vindo SÓ de subscription_status / complimentary_access.
-- ===========================================================================
alter table public.profiles add column if not exists whatsapp text;
alter table public.profiles add column if not exists is_trial boolean not null default false;
alter table public.profiles add column if not exists trial_cargo text;
-- Status comercial do lead no mini-CRM (/admin/trial).
alter table public.profiles add column if not exists trial_status text not null default 'nao_comprou';

-- Restringe trial_cargo aos 5 cargos do concurso (evita lixo vindo do cliente).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_trial_cargo_check'
  ) then
    alter table public.profiles
      add constraint profiles_trial_cargo_check
      check (trial_cargo is null or trial_cargo in ('ACA', 'ACI', 'AOR', 'ACR', 'ACS'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_trial_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_trial_status_check
      check (trial_status in ('nao_comprou', 'contatado', 'convertido', 'sem_interesse'));
  end if;
end $$;

-- trial_status é campo do ADMIN, não do usuário: sem este revoke o próprio lead
-- poderia marcar-se como "convertido" (mesma blindagem da 0008).
revoke update (trial_status) on public.profiles from anon, authenticated;

-- Segmentação de leads do teste no painel admin.
create index if not exists idx_profiles_is_trial
  on public.profiles (is_trial)
  where is_trial;

-- ===========================================================================
-- 2. free_trial_results — resultado de cada teste concluído.
--    answers guarda o payload já corrigido NO SERVIDOR (question_id,
--    selected_option_id, is_correct, module_title) para auditoria e para
--    remontar a tela de resultado sem reconsultar o banco de questões.
-- ===========================================================================
create table if not exists public.free_trial_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  cargo text not null,
  answers jsonb not null,
  score_geral numeric(5,2),
  score_por_modulo jsonb,
  completed_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- FK não é indexada automaticamente no Postgres (mesma nota do schema.sql).
create index if not exists idx_free_trial_results_user_id
  on public.free_trial_results (user_id);
create index if not exists idx_free_trial_results_completed_at
  on public.free_trial_results (completed_at desc);

-- ===========================================================================
-- 3. RLS
--    Admin usa private.is_admin() (padrão desde a 0008) em vez de e-mail
--    hardcoded: a allowlist ADMIN_EMAILS já promove is_admin=true no 1º acesso
--    ao /admin, e um e-mail cravado aqui sairia de sincronia com o env.
-- ===========================================================================
alter table public.free_trial_results enable row level security;

drop policy if exists "usuario_ve_proprio_resultado" on public.free_trial_results;
create policy "usuario_ve_proprio_resultado"
  on public.free_trial_results for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "admin_ve_tudo_trial" on public.free_trial_results;
create policy "admin_ve_tudo_trial"
  on public.free_trial_results for select to authenticated
  using ((select private.is_admin()));

drop policy if exists "usuario_insere_proprio_resultado" on public.free_trial_results;
create policy "usuario_insere_proprio_resultado"
  on public.free_trial_results for insert to authenticated
  with check ((select auth.uid()) = user_id);

commit;

-- Verificação (opcional):
-- select column_name from information_schema.columns
--   where table_schema='public' and table_name='profiles'
--     and column_name in ('whatsapp','is_trial','trial_cargo');  -- 3 linhas
--
-- select policyname from pg_policies where tablename='free_trial_results';  -- 3 linhas
