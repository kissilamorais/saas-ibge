-- ============================================================================
-- 0007 — Conteúdo por função (trilha do candidato)
-- Cole no SQL Editor do Supabase e rode. Idempotente.
-- Pré-requisito: schema.sql + 0001..0005 já aplicados.
--
-- Modelo: cada usuário escolhe UMA função-alvo (profiles.target_function).
-- Módulos e simulados declaram a quais funções pertencem; o app filtra o
-- catálogo pela função do usuário. Sem join tables — usamos text[]/text.
-- Funções (edital nº 01/2026): aca, aci, aor, acr, acs.
-- ============================================================================
begin;

-- 1. Função-alvo do candidato (nullable → dispara onboarding no 1º acesso).
alter table public.profiles
  add column if not exists target_function text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_target_function_check'
  ) then
    alter table public.profiles
      add constraint profiles_target_function_check
      check (target_function is null
             or target_function in ('aca','aci','aor','acr','acs'));
  end if;
end$$;

-- 2. Funções às quais cada módulo pertence. Default = todas (não quebra dados
--    existentes: tudo aparece até o seed reclassificar).
alter table public.modules
  add column if not exists functions text[]
    not null default array['aca','aci','aor','acr','acs'];

-- 3. Função de cada simulado (nullable = aparece para todos).
alter table public.exams
  add column if not exists function_code text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'exams_function_code_check'
  ) then
    alter table public.exams
      add constraint exams_function_code_check
      check (function_code is null
             or function_code in ('aca','aci','aor','acr','acs'));
  end if;
end$$;

-- 4. Índices para o filtro do catálogo.
create index if not exists idx_modules_functions on public.modules using gin (functions);
create index if not exists idx_exams_function_code on public.exams (function_code);

commit;

-- ====================== VERIFICAÇÃO (opcional) =============================
select 'profiles.target_function' as check, count(*) from information_schema.columns
  where table_schema = 'public' and table_name = 'profiles'
    and column_name = 'target_function'; -- espera 1
select 'modules.functions' as check, count(*) from information_schema.columns
  where table_schema = 'public' and table_name = 'modules'
    and column_name = 'functions'; -- espera 1
select 'exams.function_code' as check, count(*) from information_schema.columns
  where table_schema = 'public' and table_name = 'exams'
    and column_name = 'function_code'; -- espera 1
