-- ============================================================================
-- 0017 — Infraestrutura de privacidade/LGPD (VUL-A03 e VUL-A04 da auditoria de
-- 31/07/2026): registro de aceite de documentos legais + consentimento de
-- marketing persistido no pedido (para a Meta CAPI respeitar o opt-in mesmo
-- no webhook, que é server-to-server e não vê o cookie do comprador).
-- Cole no SQL Editor do Supabase e rode. Idempotente.
-- Pré-requisito: schema.sql + 0001..0016 já aplicados.
--
-- Nota: esta migration só prepara a estrutura. A gravação em
-- `legal_acceptances` (helper em src/lib/legal/acceptances.ts) ainda não está
-- ligada ao checkout/signup — falta publicar /termos, /privacidade e /cookies
-- com texto revisado por advogado (VUL-A03, item 1/4 do Bloco 2) antes de
-- existir um checkbox real para registrar. Já o consentimento de
-- cookies (marketing_consent) está em produção desde o banner (0017 código).
-- ============================================================================
begin;

-- ===========================================================================
-- 1. legal_acceptances — aceite eletrônico de Termos/Privacidade/Reembolso,
--    com IP/UA/versão do documento aceito. Aceite pode ocorrer ANTES de
--    existir conta (checkout guest) → e-mail é o elo, como em trial_leads.
-- ===========================================================================
create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  document text not null check (document in ('terms', 'privacy', 'refund', 'cookies')),
  version text not null,
  ip inet,
  user_agent text,
  accepted_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_legal_acceptances_email
  on public.legal_acceptances (lower(email));
create index if not exists idx_legal_acceptances_document
  on public.legal_acceptances (document);

-- Só service_role escreve/lê (mesmo padrão de trial_leads / pending_orders) —
-- sem policy, anon/authenticated não tocam a tabela.
alter table public.legal_acceptances enable row level security;

-- ===========================================================================
-- 2. pending_orders.marketing_consent — captura o opt-in de marketing NO
--    MOMENTO do checkout (a rota /api/infinitepay/checkout roda na requisição
--    do próprio comprador, então é o único ponto do fluxo de pagamento que
--    consegue ler o cookie de consentimento do navegador). O webhook (server
--    -to-server do InfinitePay) lê esta coluna em vez de tentar o cookie —
--    ele não tem o cookie do comprador de jeito nenhum.
--    NULL = sem sinal (ex.: pedido criado antes desta coluna existir) — a
--    Meta CAPI trata "não é true" como "sem consentimento" (fail-closed).
-- ===========================================================================
alter table public.pending_orders
  add column if not exists marketing_consent boolean;

commit;

-- ====================== VERIFICAÇÃO (opcional) =============================
-- select column_name from information_schema.columns
--   where table_schema='public' and table_name='legal_acceptances';
-- select column_name from information_schema.columns
--   where table_schema='public' and table_name='pending_orders'
--     and column_name='marketing_consent';
-- select policyname from pg_policies where tablename='legal_acceptances';    -- 0 linhas (só service_role)
