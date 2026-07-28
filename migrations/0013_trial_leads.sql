-- 0013 — trial_leads: funil do teste gratuito SEM conta no Supabase Auth.
-- Aplicar no banco que já rodou schema.sql + 0001..0012.
-- Idempotente. Cole no SQL Editor do Supabase.
--
-- Contexto (VUL-001):
--   Até aqui o teste gratuito criava uma conta em auth.users com o e-mail
--   digitado e `email_confirm: true` — uma identidade confirmada sem que
--   ninguém provasse posse do endereço. Isso permitia pré-registrar o e-mail
--   de um futuro comprador e receber o acesso pago no lugar dele.
--
--   Agora o lead do trial vive AQUI, fora do Auth. A conta real só nasce no
--   pagamento (lib/onboarding/guest.ts). O funil identifica o visitante por um
--   cookie httpOnly assinado (lib/trial-session.ts), não por sessão do Auth.
--
--   trial_leads         → captura de e-mail/WhatsApp para nurturing.
--   free_trial_results  → passa a aceitar lead_id (sem user_id) para o
--                         diagnóstico de quem ainda não é usuário.

begin;

-- ===========================================================================
-- 1. trial_leads
--    Sem FK com profiles/auth.users de propósito: o lead existe antes (e pode
--    nunca virar) uma conta. O vínculo com a compra é por e-mail, frouxo —
--    mesmo padrão de abandoned_checkouts (0010).
-- ===========================================================================
create table if not exists public.trial_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  whatsapp text,
  -- Preenchidos em /teste/cargo. Mesmo valor em duas grafias: trial_cargo
  -- ('ACA') segmenta o funil; target_function ('aca') é a trilha que o
  -- dashboard lê depois da compra.
  trial_cargo text,
  target_function text,
  -- Estágio comercial no mini-CRM (/admin/trial).
  trial_status text not null default 'nao_comprou',
  -- Quando o lead virou compra. Reservado: hoje o painel deriva a conversão
  -- do profiles.purchase_date por e-mail (ver lib/admin/trial.ts), porque
  -- guest.ts — que provisiona a conta paga — não é alterado por esta migration.
  converted_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Mesmos domínios da 0012, para o painel e o TS não divergirem do banco.
-- NB: trial_status usa o vocabulário JÁ existente em profiles
-- ('nao_comprou' | 'contatado' | 'convertido' | 'sem_interesse'); trocar por
-- 'novo'/'descartado' obrigaria a migrar os leads antigos, o <TrialStatusSelect>
-- e o PATCH /api/admin/trial/[id]/status sem ganho nenhum.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'trial_leads_cargo_check'
  ) then
    alter table public.trial_leads
      add constraint trial_leads_cargo_check
      check (trial_cargo is null or trial_cargo in ('ACA', 'ACI', 'AOR', 'ACR', 'ACS'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'trial_leads_target_function_check'
  ) then
    alter table public.trial_leads
      add constraint trial_leads_target_function_check
      check (target_function is null or target_function in ('aca', 'aci', 'aor', 'acr', 'acs'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'trial_leads_status_check'
  ) then
    alter table public.trial_leads
      add constraint trial_leads_status_check
      check (trial_status in ('nao_comprou', 'contatado', 'convertido', 'sem_interesse'));
  end if;
end $$;

-- E-mail NÃO é unique: a mesma pessoa pode refazer o teste. O índice serve à
-- busca por e-mail (nurturing, casamento com a compra) — em lower() porque é
-- assim que o casamento é feito no código.
create index if not exists idx_trial_leads_email on public.trial_leads (lower(email));
create index if not exists idx_trial_leads_status on public.trial_leads (trial_status);
create index if not exists idx_trial_leads_created_at on public.trial_leads (created_at desc);

-- ===========================================================================
-- 2. updated_at automático
--    Função própria em vez da extensão `moddatetime`: o projeto não habilita
--    extensões em nenhuma migration e uma função plpgsql de 4 linhas evita
--    essa dependência (mesmo estilo de handle_new_user).
-- ===========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trial_leads_set_updated_at on public.trial_leads;
create trigger trial_leads_set_updated_at
  before update on public.trial_leads
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- 3. RLS — nenhuma policy.
--    Todo acesso é via service_role (rotas de /api/trial/* e o painel admin),
--    que ignora RLS. Sem policy, anon/authenticated não leem nem escrevem
--    NADA aqui: os dados do lead (e-mail + WhatsApp) não vazam para o cliente,
--    que se identifica apenas pelo cookie assinado.
-- ===========================================================================
alter table public.trial_leads enable row level security;

-- ===========================================================================
-- 4. free_trial_results aceita resultado de lead sem conta
--    user_id vira nullable e ganha um irmão lead_id. Linhas antigas continuam
--    com user_id; as novas do funil de convidado nascem com lead_id.
-- ===========================================================================
alter table public.free_trial_results
  add column if not exists lead_id uuid references public.trial_leads(id) on delete cascade;

alter table public.free_trial_results alter column user_id drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'free_trial_results_owner_check'
  ) then
    alter table public.free_trial_results
      add constraint free_trial_results_owner_check
      check (user_id is not null or lead_id is not null);
  end if;
end $$;

create index if not exists idx_free_trial_results_lead_id
  on public.free_trial_results (lead_id);

-- As policies da 0012 seguem valendo para as linhas com user_id (auth.uid() =
-- user_id nunca casa com NULL). As linhas de lead são lidas só via service_role,
-- filtradas por lead_id — o cookie assinado é quem prova de quem é o resultado.

-- ===========================================================================
-- 5. Backfill: leads antigos que viraram conta no Auth (profiles.is_trial)
--    Sem isto o /admin/trial ficaria vazio no dia do deploy — a fonte de dados
--    do painel passa a ser trial_leads. Idempotente pelo `not exists`.
-- ===========================================================================
insert into public.trial_leads (
  email, full_name, whatsapp, trial_cargo, target_function,
  trial_status, converted_at, created_at, updated_at
)
select
  p.email,
  coalesce(nullif(btrim(p.full_name), ''), p.email),
  p.whatsapp,
  p.trial_cargo,
  p.target_function,
  p.trial_status,
  p.purchase_date,
  p.created_at,
  p.updated_at
from public.profiles p
where p.is_trial
  and not exists (
    select 1 from public.trial_leads l where lower(l.email) = lower(p.email)
  );

-- Liga os diagnósticos já concluídos ao lead recém-criado, para o painel não
-- perder score/dificuldades do histórico.
update public.free_trial_results r
set lead_id = l.id
from public.profiles p, public.trial_leads l
where r.user_id = p.id
  and lower(l.email) = lower(p.email)
  and r.lead_id is null;

commit;

-- Verificação (opcional):
-- select count(*) from public.trial_leads;                                  -- leads migrados
-- select column_name, is_nullable from information_schema.columns
--   where table_schema='public' and table_name='free_trial_results'
--     and column_name in ('user_id','lead_id');                             -- 2 linhas, user_id YES
-- select policyname from pg_policies where tablename='trial_leads';         -- 0 linhas (só service_role)
