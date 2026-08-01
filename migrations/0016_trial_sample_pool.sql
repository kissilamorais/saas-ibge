-- ============================================================================
-- 0016 — Pool fixo de questões do diagnóstico gratuito (VUL-A06 da auditoria
-- de 31/07/2026).
-- Cole no SQL Editor do Supabase e rode. Idempotente.
-- Pré-requisito: schema.sql + 0001..0015 já aplicados.
--
-- Contexto:
--   /api/trial/questions sorteava as 10 questões do diagnóstico sobre TODO o
--   pool de cada módulo (1.096 questões no total) — o gate era só um cookie de
--   convidado, obtido em /api/trial/signup com nome+e-mail sintéticos. Ao
--   IP/rate limit real por trás, o "problema do colecionador de cupons" deixa
--   o banco inteiro raspável em minutos (ver AUDITORIA-2026-07-31.md).
--
--   A correção reserva um pool fixo e pequeno (`is_trial_sample = true`) por
--   módulo: o teto de exposição vira o pool (50 questões), não o acervo. O
--   código (0016 em diante) também passa a persistir o sorteio de cada lead em
--   trial_leads.sampled_question_ids — refazer/recarregar o teste devolve
--   sempre o MESMO conjunto, então múltiplas chamadas não ampliam a
--   exposição além dessas 10 questões por lead.
-- ============================================================================
begin;

-- ===========================================================================
-- 1. Marcador do pool de amostra + índice parcial (a query do trial filtra
--    por module_id com is_trial_sample = true; índice parcial mantém isso
--    barato mesmo com o acervo crescendo).
-- ===========================================================================
alter table public.questions
  add column if not exists is_trial_sample boolean not null default false;

create index if not exists idx_questions_trial_sample
  on public.questions (module_id)
  where is_trial_sample;

-- ===========================================================================
-- 2. Sorteio persistido por lead — os ids exibidos na primeira chamada de
--    /api/trial/questions, reaproveitados em qualquer chamada seguinte do
--    mesmo lead (ver correção no código).
-- ===========================================================================
alter table public.trial_leads
  add column if not exists sampled_question_ids uuid[];

-- ===========================================================================
-- 3. Popula o pool: até 10 questões multiple_choice por módulo do
--    diagnóstico (5 módulos × 10 = 50 questões expostas no total, ante as
--    ~1.096 do acervo). Escolha determinística por id — rodar de novo não
--    troca o conjunto marcado.
-- ===========================================================================
with alvo as (
  select id
  from public.modules
  where slug in (
    'portugues',
    'raciocinio-logico',
    'administracao',
    'informatica',
    'conhecimentos-tecnicos'
  )
),
ranked as (
  select q.id,
         row_number() over (partition by q.module_id order by q.id) as rn
  from public.questions q
  join alvo a on a.id = q.module_id
  where q.question_type = 'multiple_choice'
)
update public.questions
set is_trial_sample = true
where id in (select id from ranked where rn <= 10);

commit;

-- ====================== VERIFICAÇÃO (opcional) =============================
-- select m.slug, count(*) from public.questions q
--   join public.modules m on m.id = q.module_id
--   where q.is_trial_sample
--   group by m.slug;                                    -- espera 10 por módulo, 50 no total
-- select column_name from information_schema.columns
--   where table_schema='public' and table_name='trial_leads'
--     and column_name='sampled_question_ids';            -- 1 linha
