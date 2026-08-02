-- ===========================================================================
-- 0019 — Retenção de dados (LGPD, decisão de 01/08/2026)
--
-- Prazos declarados na Política de Privacidade (/privacidade):
--   Leads não convertidos ........ 24 meses
--   Pedidos pendentes não pagos ... 90 dias
--   Checkouts abandonados ......... 6 meses
--   Dados de compra ............... 5 anos (obrigação fiscal — NÃO deletar)
--
-- Os jobs rodam às 03:00 UTC (00:00 em BRT). `cron.schedule` faz upsert pelo
-- nome do job (pg_cron >= 1.4), então reaplicar esta migration atualiza os
-- jobs existentes em vez de duplicá-los.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. pg_cron
--    Nenhuma migration anterior criou extensão — sem isto, os `cron.schedule`
--    abaixo falham com «schema "cron" does not exist».
--    No Supabase a extensão também pode ser ligada em Database > Extensions;
--    ela só funciona no banco `postgres`.
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron;

-- ---------------------------------------------------------------------------
-- 2. Índice de apoio
--    O job de leads correlaciona `trial_leads.email` com `profiles.email` por
--    `lower()`. Existe índice em lower(trial_leads.email) (0013), mas nenhum
--    do lado de profiles — sem este, cada varredura diária faz seq scan em
--    profiles para cada lead candidato.
-- ---------------------------------------------------------------------------
create index if not exists idx_profiles_email_lower
  on public.profiles (lower(email));

-- ---------------------------------------------------------------------------
-- 3. Leads do diagnóstico gratuito que não compraram — 24 meses
--    Quem comprou é preservado: o dado da compra tem retenção fiscal de 5
--    anos e a correlação é por e-mail (o lead não tem FK para profiles).
--    `free_trial_results.lead_id` tem ON DELETE CASCADE (0013), então os
--    resultados do diagnóstico saem junto.
-- ---------------------------------------------------------------------------
select cron.schedule(
  'retention-trial-leads',
  '0 3 * * *',
  $$
    delete from public.trial_leads
    where created_at < now() - interval '24 months'
      and not exists (
        select 1 from public.profiles p
        where lower(p.email) = lower(trial_leads.email)
          and p.purchase_date is not null
      );
  $$
);

-- ---------------------------------------------------------------------------
-- 4. Pedidos pendentes não pagos — 90 dias
--    Só `status = 'pending'`. Pedidos pagos são dado de compra (5 anos).
-- ---------------------------------------------------------------------------
select cron.schedule(
  'retention-pending-orders',
  '0 3 * * *',
  $$
    delete from public.pending_orders
    where status = 'pending'
      and created_at < now() - interval '90 days';
  $$
);

-- ---------------------------------------------------------------------------
-- 5. Checkouts abandonados — 6 meses
--    A tabela é alimentada pelo `checkout.session.expired` do Stripe, que foi
--    removido — não há entradas novas. O job zera o histórico remanescente
--    dentro do prazo e continua válido se o rastreamento voltar por outro
--    provedor.
-- ---------------------------------------------------------------------------
select cron.schedule(
  'retention-abandoned-checkouts',
  '0 3 * * *',
  $$
    delete from public.abandoned_checkouts
    where created_at < now() - interval '6 months';
  $$
);

-- ===========================================================================
-- Verificação (rodar após aplicar):
--
--   select jobname, schedule, active from cron.job
--   where jobname like 'retention-%';
--     -> 3 linhas, active = true
--
--   select jobname, status, return_message, start_time
--   from cron.job_run_details
--   where jobname like 'retention-%'
--   order by start_time desc limit 10;
--     -> após a 1ª execução (03:00 UTC), status = 'succeeded'
--
-- NÃO coberto por esta migration: `admin_audit_log`. A Política de
-- Privacidade declara «Logs de segurança: 6 meses», mas apagar trilha de
-- auditoria é decisão deliberada — ver nota no commit.
-- ===========================================================================
