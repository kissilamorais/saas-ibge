-- Migration 0010 — rastreamento de checkout abandonado.
-- Aplicar no banco que já rodou schema.sql + 0001..0009.
-- Idempotente. Cole no SQL Editor do Supabase.
--
-- Contexto:
--   Com `after_expiration.recovery.enabled` na criação da Checkout Session, a
--   Stripe dispara `checkout.session.expired` quando a sessão atinge
--   `expires_at` sem pagamento, e anexa uma `recovery.url` ao payload. Abrir
--   essa URL cria uma NOVA sessão, cópia da expirada.
--
--   Esta tabela guarda esses abandonos para visibilidade no painel admin. O
--   disparo de e-mail é MANUAL nesta fase (o admin copia o link) — não há
--   envio automático.
--
-- Sobre consent_status:
--   `consent_collection.promotions` da Stripe só coleta consentimento quando
--   empresa E cliente estão nos EUA ("Only available to US merchants and US
--   customers"). Como a Aprovus é BR com clientes BR, a caixa nunca é exibida
--   e `consent.promotions` vem sempre null. Por isso NULL significa
--   "não coletado" — que é diferente de 'opt_out' ("recusado"). Nenhuma
--   automação futura deve tratar NULL como recusa.

begin;

-- ===========================================================================
-- 1. abandoned_checkouts
--    Sem FK com profiles de propósito: a maioria dos abandonos é de visitante
--    que nunca criou conta (checkout guest). O vínculo é por e-mail, frouxo.
-- ===========================================================================
create table if not exists public.abandoned_checkouts (
  id uuid default gen_random_uuid() primary key,
  -- id da Checkout Session expirada (cs_...). Único: dá idempotência a nível
  -- de linha, independente da dedupe por event.id em stripe_events.
  session_id text not null unique,
  email text not null,
  full_name text,
  -- URL de recuperação gerada pela Stripe. Nullable: sessões criadas antes
  -- desta feature expiram sem recovery.
  recovery_url text,
  -- Quando a recovery_url deixa de funcionar (recovery.expires_at da Stripe).
  recovery_expires_at timestamp with time zone,
  -- 'opt_in' | 'opt_out' | null (= não coletado, ver nota acima).
  consent_status text,
  amount_cents integer,
  currency text not null default 'brl',
  expired_at timestamp with time zone not null,
  -- Preenchido quando o e-mail/sessão vira compra. Null = ainda não recuperado.
  recovered_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'abandoned_checkouts_consent_status_check'
  ) then
    alter table public.abandoned_checkouts
      add constraint abandoned_checkouts_consent_status_check
      check (consent_status is null or consent_status in ('opt_in', 'opt_out'));
  end if;
end $$;

-- Casamento por e-mail (fallback quando não há recovered_from) e listagem.
create index if not exists idx_abandoned_checkouts_email
  on public.abandoned_checkouts (lower(email));
create index if not exists idx_abandoned_checkouts_expired_at
  on public.abandoned_checkouts (expired_at desc);
-- Parcial: a busca de "pendentes de recuperação" é a mais frequente.
create index if not exists idx_abandoned_checkouts_pending
  on public.abandoned_checkouts (lower(email))
  where recovered_at is null;

-- ===========================================================================
-- 2. RLS — mesmo padrão de complimentary_access (0008).
--    O webhook escreve via service_role, que ignora RLS. A policy abaixo
--    existe só para leitura pelo painel via cliente autenticado.
-- ===========================================================================
alter table public.abandoned_checkouts enable row level security;

drop policy if exists "Admins manage abandoned checkouts" on public.abandoned_checkouts;
create policy "Admins manage abandoned checkouts"
  on public.abandoned_checkouts for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

commit;

-- Verificação (opcional):
-- select column_name, data_type, is_nullable
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'abandoned_checkouts'
--   order by ordinal_position;
