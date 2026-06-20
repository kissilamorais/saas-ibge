-- =====================================================================
-- FIX — rode no Supabase SQL Editor (uma vez)
-- O check constraint original não permitia 'inactive' (o próprio valor
-- padrão), o que fazia o cadastro falhar ao criar o profile.
-- Aqui recriamos o constraint incluindo 'inactive'.
-- =====================================================================

alter table public.profiles
  drop constraint if exists profiles_subscription_status_check;

alter table public.profiles
  add constraint profiles_subscription_status_check
  check (subscription_status in ('inactive', 'active', 'cancelled', 'expired'));
