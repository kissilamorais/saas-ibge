-- ============================================================================
-- 0015 — Fecha a escalada de acesso pago via UPDATE direto em `profiles`.
-- Cole no SQL Editor do Supabase e rode. Idempotente.
-- Pré-requisito: schema.sql + 0001..0014 já aplicados.
--
-- Contexto (VUL-A01 da auditoria de 31/07/2026):
--   A policy "Users can update their own profile" (0001) permite ao usuário
--   alterar QUALQUER coluna da própria linha. A 0008 reconheceu o risco e
--   revogou is_admin/lead_followup_*/utm_*; a 0012 revogou trial_status. Ficaram
--   de fora justamente as colunas que decidem dinheiro e identidade:
--
--     subscription_status  → é o que private.has_content_access() lê. Setar
--                            'active' liberava TODO o conteúdo pago de graça.
--     purchase_date        → gate temporal dos bônus (lib/bonuses/unlock.ts).
--     course_access_until  → validade do acesso.
--     stripe_customer_id   → vínculo com o provedor de pagamento.
--     email                → chave de casamento de complimentary_access (0008) e
--                            de onboardGuestByEmail (lib/onboarding/guest.ts).
--                            Reescrevê-la permitia herdar a cortesia de outro
--                            e-mail — ou receber o acesso de uma compra alheia.
--     is_trial             → flag de segmentação do funil, não do usuário.
--
--   Quem escreve essas colunas é SÓ o servidor, depois de confirmar o pagamento
--   (activateUserAccess, via service_role — que não é afetado pelos grants de
--   coluna abaixo). O resto do profile o usuário segue editando normalmente
--   (full_name, avatar_url, exam_date, metas, target_function, whatsapp...).
-- ============================================================================
begin;

-- ===========================================================================
-- 1. Camada 1 — privilégio de coluna.
--    Barra no nível do GRANT, antes mesmo de a policy de RLS ser avaliada.
-- ===========================================================================
revoke update (
  subscription_status,
  purchase_date,
  course_access_until,
  stripe_customer_id,
  email,
  is_trial
) on public.profiles from anon, authenticated;

-- ===========================================================================
-- 2. Camada 2 — trigger de defesa em profundidade.
--    Um `grant all on public.profiles to authenticated` futuro (comum ao
--    recriar o schema, e o que originalmente deu o privilégio) reabriria o
--    buraco em silêncio. O trigger não depende de grants.
--
--    Falha ALTO de propósito: nenhuma escrita legítima do app toca estas
--    colunas pela sessão do usuário, então uma exceção aqui só acontece em
--    tentativa de adulteração — e é melhor que apareça no log a ser revertida
--    silenciosamente. `is distinct from` para tratar NULL corretamente.
-- ===========================================================================
create or replace function public.protect_profile_billing_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- O servidor (client admin) conecta como `service_role`; migrations e o
  -- dashboard do Supabase, como `postgres`/`supabase_admin`. Esses passam.
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if new.subscription_status is distinct from old.subscription_status
     or new.purchase_date       is distinct from old.purchase_date
     or new.course_access_until is distinct from old.course_access_until
     or new.stripe_customer_id  is distinct from old.stripe_customer_id
     or new.email               is distinct from old.email
     or new.is_admin            is distinct from old.is_admin
     or new.is_trial            is distinct from old.is_trial
  then
    raise exception
      'coluna protegida de profiles: alteração permitida apenas ao servidor'
      using errcode = '42501'; -- insufficient_privilege
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_billing on public.profiles;
create trigger profiles_protect_billing
  before update on public.profiles
  for each row execute function public.protect_profile_billing_columns();

commit;

-- ====================== VERIFICAÇÃO (rode e confira) ========================
-- 1) Colunas que anon/authenticated ainda podem atualizar. NÃO deve aparecer
--    nenhuma da lista revogada acima (esperado: full_name, avatar_url,
--    exam_date, daily_goal_hours, weekly_goal_hours, target_function,
--    whatsapp, trial_cargo, created_at, updated_at, id).
-- select column_name
--   from information_schema.column_privileges
--  where table_schema = 'public' and table_name = 'profiles'
--    and grantee in ('anon', 'authenticated')
--    and privilege_type = 'UPDATE'
--  order by column_name;
--
-- 2) Trigger instalado (espera 1 linha).
-- select tgname from pg_trigger
--  where tgrelid = 'public.profiles'::regclass and not tgisinternal;

-- ============== AUDITORIA RETROATIVA (rode ANTES de relaxar) ================
-- Acessos ativos SEM pedido pago e SEM cortesia registrada. Cada linha é ou
-- ativação manual não rastreada, ou exploração da falha corrigida aqui.
-- Revise uma a uma antes de revogar.
-- select p.id, p.email, p.subscription_status, p.purchase_date, p.created_at
--   from public.profiles p
--  where p.subscription_status = 'active'
--    and not exists (select 1 from public.pending_orders o
--                     where lower(o.customer_email) = lower(p.email)
--                       and o.status = 'paid')
--    and not exists (select 1 from public.complimentary_access c
--                     where lower(c.email) = lower(p.email)
--                       and c.revoked_at is null)
--  order by p.created_at desc;
