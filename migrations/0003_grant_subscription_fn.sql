-- Migration 0003 — corrige permissão da função de gate de assinatura.
--
-- Na 0001, `revoke execute ... from public` removeu o EXECUTE também do role
-- `authenticated` (que herda de PUBLIC). Como as policies de RLS chamam
-- `private.has_active_subscription()` no contexto do usuário autenticado, a
-- avaliação falhava com 42501 "permission denied for function".
--
-- Conteúdo (lessons/questions/exams/...) ficava inacessível mesmo para assinantes.

grant usage on schema private to authenticated;
grant execute on function private.has_active_subscription() to authenticated;
