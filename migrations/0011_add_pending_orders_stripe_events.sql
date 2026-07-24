-- Migration 0011 — materializa pending_orders e stripe_events.
-- Aplicar no banco que já rodou schema.sql + 0001..0010.
-- Idempotente. Cole no SQL Editor do Supabase.
--
-- Contexto:
--   Estas duas tabelas foram criadas à mão em produção e nunca entraram no
--   controle de versão (drift). Este arquivo as materializa EXATAMENTE como o
--   código as usa hoje, com CREATE TABLE IF NOT EXISTS — então rodar contra o
--   banco atual NÃO recria/apaga nada; serve para (a) versão e (b) travar o RLS.
--
--   pending_orders  → reconciliação do checkout InfinitePay (order_nsu ↔ webhook).
--   stripe_events   → dedupe/idempotência do webhook Stripe (legado, por event.id).
--
-- Segurança (o ponto do P2-6):
--   Ambas guardam dado sensível (e-mail de comprador / eventos de pagamento) e
--   só são acessadas pelo servidor via service_role, que IGNORA RLS. Habilitamos
--   RLS SEM criar policy para anon/authenticated → ninguém além do service_role
--   consegue ler/escrever. Se o RLS estiver desligado hoje, este arquivo o liga
--   sem quebrar o app (o admin client segue funcionando).

begin;

-- ===========================================================================
-- 1. pending_orders — pedido pendente do checkout InfinitePay.
--    Colunas inferidas do uso em src/app/api/infinitepay/*.
-- ===========================================================================
create table if not exists public.pending_orders (
  id uuid default gen_random_uuid() primary key,
  -- UUID emitido por nós; amarra o pedido ao link/webhook. Único → o webhook
  -- reivindica de forma idempotente por este valor.
  order_nsu text not null unique,
  -- Valor em centavos (COURSE_PRICE_CENTS = 9700).
  amount integer not null,
  -- 'pending' na criação; vira 'paid' no claim atômico do webhook/safety-net.
  status text not null default 'pending',
  -- E-mail do comprador (guest: coletado no checkout). Nullable por histórico.
  customer_email text,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- Restringe status aos valores que o código usa (só afeta bancos novos).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pending_orders_status_check'
  ) then
    alter table public.pending_orders
      add constraint pending_orders_status_check
      check (status in ('pending', 'paid'));
  end if;
end $$;

-- Varreduras por status (ex.: limpeza de pendentes) e ordenação recente.
create index if not exists idx_pending_orders_status
  on public.pending_orders (status);
create index if not exists idx_pending_orders_created_at
  on public.pending_orders (created_at desc);

-- ===========================================================================
-- 2. stripe_events — idempotência do webhook Stripe (legado).
--    Colunas inferidas de src/app/api/stripe/webhook/route.ts
--    (insert { id, type }; dedupe por PK; delete por id em falha).
-- ===========================================================================
create table if not exists public.stripe_events (
  -- event.id da Stripe (evt_...). PK → o insert duplicado (23505) sinaliza
  -- reentrega já processada.
  id text primary key,
  type text,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

-- ===========================================================================
-- 3. RLS — habilita em ambas SEM policy (só service_role acessa).
-- ===========================================================================
alter table public.pending_orders enable row level security;
alter table public.stripe_events  enable row level security;

commit;

-- Verificação (opcional):
-- select relname, relrowsecurity
--   from pg_class
--   where relname in ('pending_orders', 'stripe_events');
-- -- relrowsecurity deve ser true nas duas.
--
-- select tablename, policyname
--   from pg_policies
--   where tablename in ('pending_orders', 'stripe_events');
-- -- não deve retornar nenhuma linha (nenhuma policy = só service_role).
