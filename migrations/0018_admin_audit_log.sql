-- ============================================================================
-- 0018 — admin_audit_log: quem fez o quê no painel administrativo (auditoria
-- de 31/07/2026, item 22 do Bloco 3 — parte de log; MFA fica para depois).
-- Cole no SQL Editor do Supabase e rode. Idempotente.
-- Pré-requisito: schema.sql + 0001..0017 já aplicados.
--
-- Contexto: o painel /admin tem autenticação e autorização corretas
-- (requireAdmin), mas nenhuma trilha de auditoria — uma cortesia concedida,
-- um lead marcado como convertido ou um depoimento apagado não deixava
-- rastro de QUEM fez a ação. Isso importa tanto para investigar abuso de uma
-- conta admin comprometida quanto para disputa interna ("quem mudou isso?").
-- ============================================================================
begin;

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  -- set null (não cascade): o log de uma ação sobrevive à exclusão da conta
  -- do admin que a praticou — é justamente o tipo de registro que não pode
  -- desaparecer junto com o autor.
  admin_id uuid references auth.users(id) on delete set null,
  admin_email text not null,
  action text not null,
  -- Alvo da ação em texto livre (id de lead/depoimento/e-mail de cortesia) —
  -- não é FK de propósito: o alvo pode ser de tabelas diferentes por action,
  -- e pode deixar de existir (linha apagada) sem invalidar o log.
  target text,
  details jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_admin_audit_log_admin_id
  on public.admin_audit_log (admin_id);
create index if not exists idx_admin_audit_log_action
  on public.admin_audit_log (action);
create index if not exists idx_admin_audit_log_created_at
  on public.admin_audit_log (created_at desc);

-- Só service_role escreve/lê (mesmo padrão de trial_leads/pending_orders) —
-- sem policy, anon/authenticated não tocam a tabela. Nem o próprio admin lê
-- via client comum: consulta ao log é tarefa de investigação, não de UI.
alter table public.admin_audit_log enable row level security;

commit;

-- ====================== VERIFICAÇÃO (opcional) =============================
-- select column_name from information_schema.columns
--   where table_schema='public' and table_name='admin_audit_log';
-- select policyname from pg_policies where tablename='admin_audit_log';      -- 0 linhas (só service_role)
