-- =====================================================================
--  PLATAFORMA DE ESTUDOS — Censo Agro 2026  ·  Migration inicial
--  Supabase / PostgreSQL  ·  rodar via `supabase db push` ou SQL Editor
--  Convenção: tudo em schema public; segurança via RLS + auth.uid()
-- =====================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- =====================================================================
--  ENUMS
-- =====================================================================
create type plan_tier            as enum ('basic','premium','lifetime');
create type knowledge_level      as enum ('beginner','intermediate','advanced');
create type difficulty_level     as enum ('facil','medio','dificil');
create type progress_status      as enum ('not_started','in_progress','completed');
create type session_type         as enum ('study','revision','exam');
create type session_status       as enum ('pending','done','missed','rescheduled');
create type revision_status      as enum ('pending','done','late');
create type exam_attempt_status  as enum ('in_progress','finished','abandoned');
create type subscription_status  as enum ('active','trialing','past_due','canceled','incomplete');
create type payment_status       as enum ('succeeded','pending','failed','refunded');
create type notification_type    as enum ('study_time','revision_due','exam_scheduled','goal_missed','weekly_summary','motivation');
create type notification_channel as enum ('in_app','push','email','whatsapp');
create type xp_source            as enum ('lesson','revision','question','exam','streak');

-- =====================================================================
--  IDENTIDADE
-- =====================================================================
create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  full_name        text,
  avatar_url       text,
  target_exam_date date,
  daily_hours_goal numeric(4,1) default 2,          -- horas/dia
  weekly_days_goal smallint     default 5,          -- dias/semana
  knowledge_level  knowledge_level default 'beginner',
  xp               integer       not null default 0,
  current_streak   integer       not null default 0,
  longest_streak   integer       not null default 0,
  last_active_date date,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

-- =====================================================================
--  CONTEÚDO (gerenciado por admin / service role)
-- =====================================================================
create table courses (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  description  text,
  orgao        text default 'IBGE',
  banca        text default 'IBFC',
  cover_url    text,
  min_plan     plan_tier not null default 'basic',  -- gating de acesso
  position     integer   not null default 0,
  is_published boolean   not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table modules (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references courses(id) on delete cascade,
  title        text not null,
  description  text,
  function_tag text,                                  -- ACA | ACI | AOR | ACR | ACS (ou null = comum)
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

create table lessons (
  id                uuid primary key default gen_random_uuid(),
  module_id         uuid not null references modules(id) on delete cascade,
  slug              text not null,
  title             text not null,
  content_md        text,            -- teoria
  summary_md        text,            -- resumo
  video_url         text,
  pdf_url           text,
  estimated_minutes integer not null default 30,
  difficulty        difficulty_level default 'medio',
  position          integer not null default 0,
  is_published      boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (module_id, slug)
);

create table lesson_checklist_items (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid not null references lessons(id) on delete cascade,
  label      text not null,
  position   integer not null default 0
);

create table flashcards (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid references lessons(id) on delete cascade,
  discipline text,
  front      text not null,
  back       text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create table questions (
  id             uuid primary key default gen_random_uuid(),
  lesson_id      uuid references lessons(id) on delete set null,
  discipline     text not null,                       -- Português | RLQ | Administração | Informática | Conhec. Técnicos
  subject        text,                                -- assunto/tópico
  banca          text default 'IBFC',
  difficulty     difficulty_level not null default 'medio',
  statement_md   text not null,                       -- enunciado
  explanation_md text,                                -- comentário/gabarito comentado
  source         text,                                -- ex.: "Lote 1 - ADM-D05"
  created_at     timestamptz not null default now()
);

-- Alternativas (A–E) de cada questão
create table answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  label       text not null,                          -- 'A'..'E'
  content_md  text not null,
  is_correct  boolean not null default false,
  position    integer not null default 0,
  unique (question_id, label)
);

create table exams (
  id               uuid primary key default gen_random_uuid(),
  course_id        uuid references courses(id) on delete set null,
  title            text not null,
  description      text,
  function_tag     text,
  num_questions    integer not null default 60,
  duration_minutes integer not null default 240,
  min_plan         plan_tier not null default 'basic',
  is_published     boolean not null default false,
  created_at       timestamptz not null default now()
);

create table exam_questions (
  exam_id     uuid not null references exams(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  position    integer not null default 0,
  primary key (exam_id, question_id)
);

-- =====================================================================
--  PROGRESSO & ESTUDO (por usuário)
-- =====================================================================
create table lesson_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  lesson_id     uuid not null references lessons(id) on delete cascade,
  status        progress_status not null default 'not_started',
  last_position integer default 0,                    -- segundos do vídeo / scroll
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table study_plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  course_id       uuid references courses(id) on delete set null,
  exam_date       date not null,
  daily_hours     numeric(4,1) not null,
  weekly_days     smallint not null,
  weekdays        smallint[] not null default '{1,2,3,4,5}',  -- 0=Dom .. 6=Sáb
  knowledge_level knowledge_level not null default 'beginner',
  is_active       boolean not null default true,
  generated_at    timestamptz not null default now()
);

create table study_sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  plan_id        uuid references study_plans(id) on delete cascade,
  lesson_id      uuid references lessons(id) on delete set null,
  exam_id        uuid references exams(id) on delete set null,
  type           session_type   not null default 'study',
  scheduled_date date not null,
  planned_minutes integer not null default 30,
  actual_minutes  integer not null default 0,
  status         session_status not null default 'pending',
  created_at     timestamptz not null default now()
);

create table revisions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  lesson_id    uuid not null references lessons(id) on delete cascade,
  stage        smallint not null,                     -- 1..5 → 24h,7d,15d,30d,60d
  due_date     date not null,
  completed_at timestamptz,
  status       revision_status not null default 'pending',
  created_at   timestamptz not null default now(),
  unique (user_id, lesson_id, stage)
);

-- =====================================================================
--  PERSONALIZAÇÃO DA AULA (por usuário)
-- =====================================================================
create table user_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  lesson_id  uuid not null references lessons(id) on delete cascade,
  body_md    text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_highlights (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  lesson_id  uuid not null references lessons(id) on delete cascade,
  text       text not null,
  location   jsonb,                                   -- offsets/range serializados
  color      text default 'yellow',
  created_at timestamptz not null default now()
);

create table user_favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  lesson_id  uuid not null references lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- =====================================================================
--  QUESTÕES & SIMULADOS (tentativas do usuário)
-- =====================================================================
create table question_attempts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  question_id        uuid not null references questions(id) on delete cascade,
  selected_answer_id uuid references answers(id) on delete set null,
  is_correct         boolean not null default false,
  time_spent_seconds integer not null default 0,
  created_at         timestamptz not null default now()
);

create table exam_attempts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  exam_id            uuid not null references exams(id) on delete cascade,
  status             exam_attempt_status not null default 'in_progress',
  score              integer,                          -- pontos (0..num_questions)
  correct_count      integer default 0,
  wrong_count        integer default 0,
  blank_count        integer default 0,
  time_spent_seconds integer default 0,
  started_at         timestamptz not null default now(),
  finished_at        timestamptz
);

create table exam_attempt_answers (
  id                 uuid primary key default gen_random_uuid(),
  exam_attempt_id    uuid not null references exam_attempts(id) on delete cascade,
  question_id        uuid not null references questions(id) on delete cascade,
  selected_answer_id uuid references answers(id) on delete set null,
  is_correct         boolean not null default false,
  unique (exam_attempt_id, question_id)
);

-- =====================================================================
--  GAMIFICAÇÃO
-- =====================================================================
create table achievements (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,                   -- 'streak_7', 'questions_100', ...
  title       text not null,
  description text,
  icon        text,
  xp_reward   integer not null default 0,
  criteria    jsonb                                   -- {"type":"streak","value":7}
);

create table user_achievements (
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table xp_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  source     xp_source not null,
  ref_id     uuid,                                    -- id da aula/questão/etc.
  xp         integer not null,
  created_at timestamptz not null default now()
);

-- =====================================================================
--  COBRANÇA (escrita SOMENTE via service role / webhook Stripe)
-- =====================================================================
create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  plan_tier              plan_tier not null default 'basic',
  status                 subscription_status not null default 'incomplete',
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  current_period_end     timestamptz,                 -- null = vitalício
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table payments (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  subscription_id          uuid references subscriptions(id) on delete set null,
  stripe_payment_intent_id text unique,
  amount_cents             integer not null,
  currency                 text not null default 'brl',
  status                   payment_status not null default 'pending',
  created_at               timestamptz not null default now()
);

-- =====================================================================
--  NOTIFICAÇÕES
-- =====================================================================
create table notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          notification_type not null,
  channel       notification_channel not null default 'in_app',
  title         text not null,
  body          text,
  payload       jsonb,
  scheduled_for timestamptz,
  sent_at       timestamptz,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

-- =====================================================================
--  ÍNDICES (FKs + filtros quentes)
-- =====================================================================
create index idx_modules_course        on modules(course_id, position);
create index idx_lessons_module         on lessons(module_id, position);
create index idx_flashcards_lesson      on flashcards(lesson_id);
create index idx_questions_filter       on questions(discipline, difficulty);
create index idx_questions_lesson       on questions(lesson_id);
create index idx_answers_question       on answers(question_id);
create index idx_examq_exam             on exam_questions(exam_id, position);
create index idx_lessonprog_user        on lesson_progress(user_id, status);
create index idx_plans_user_active      on study_plans(user_id, is_active);
create index idx_sessions_user_date     on study_sessions(user_id, scheduled_date);
create index idx_sessions_status        on study_sessions(user_id, status);
create index idx_revisions_user_due     on revisions(user_id, due_date, status);
create index idx_qattempts_user_time    on question_attempts(user_id, created_at);
create index idx_qattempts_question     on question_attempts(question_id);
create index idx_examatt_user           on exam_attempts(user_id, exam_id);
create index idx_examattans_attempt     on exam_attempt_answers(exam_attempt_id);
create index idx_notes_user_lesson      on user_notes(user_id, lesson_id);
create index idx_highlights_user_lesson on user_highlights(user_id, lesson_id);
create index idx_xp_user                on xp_events(user_id, created_at);
create index idx_subs_user              on subscriptions(user_id, status);
create index idx_notif_pending          on notifications(scheduled_for) where sent_at is null;

-- =====================================================================
--  FUNÇÕES UTILITÁRIAS
-- =====================================================================

-- updated_at automático
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- nível textual a partir do XP (Fase 10)
create or replace function level_for_xp(p_xp integer) returns text
language sql immutable as $$
  select case
    when p_xp >= 10000 then 'Aprovado'
    when p_xp >=  5000 then 'Especialista'
    when p_xp >=  2500 then 'Avançado'
    when p_xp >=  1000 then 'Intermediário'
    when p_xp >=   300 then 'Aprendiz'
    else 'Iniciante'
  end;
$$;

-- plano efetivo do usuário (assinatura ativa; senão 'basic')
create or replace function user_plan(p_user uuid) returns plan_tier
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select plan_tier from subscriptions
      where user_id = p_user and status in ('active','trialing')
      order by current_period_end desc nulls first limit 1),
    'basic'::plan_tier);
$$;

-- usuário tem acesso ao conteúdo de min_plan exigido?
create or replace function has_plan_access(p_user uuid, p_required plan_tier) returns boolean
language sql stable security definer set search_path = public as $$
  with rank(t,n) as (values ('basic'::plan_tier,1),('premium'::plan_tier,2),('lifetime'::plan_tier,3))
  select (select n from rank where t = user_plan(p_user))
       >= (select n from rank where t = p_required);
$$;

-- concede XP, registra evento e atualiza streak/atividade
create or replace function award_xp(p_user uuid, p_source xp_source, p_ref uuid, p_amount integer)
returns void language plpgsql security definer set search_path = public as $$
declare v_last date;
begin
  insert into xp_events(user_id, source, ref_id, xp) values (p_user, p_source, p_ref, p_amount);

  select last_active_date into v_last from profiles where id = p_user for update;
  update profiles set
    xp = xp + p_amount,
    current_streak = case
      when v_last = current_date then current_streak               -- já ativo hoje
      when v_last = current_date - 1 then current_streak + 1        -- manteve a sequência
      else 1                                                        -- recomeça
    end,
    longest_streak = greatest(longest_streak,
      case when v_last = current_date then current_streak
           when v_last = current_date - 1 then current_streak + 1
           else 1 end),
    last_active_date = current_date
  where id = p_user;

  perform check_achievements(p_user);
end; $$;

-- avalia e desbloqueia conquistas (streak e nº de questões)
create or replace function check_achievements(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a record; v_streak int; v_questions int;
begin
  select current_streak into v_streak from profiles where id = p_user;
  select count(*) into v_questions from question_attempts where user_id = p_user;

  for a in select * from achievements loop
    if (a.criteria->>'type' = 'streak'    and v_streak    >= (a.criteria->>'value')::int)
    or (a.criteria->>'type' = 'questions' and v_questions >= (a.criteria->>'value')::int)
    then
      insert into user_achievements(user_id, achievement_id)
      values (p_user, a.id) on conflict do nothing;
    end if;
  end loop;
end; $$;

-- =====================================================================
--  TRIGGERS DE NEGÓCIO
-- =====================================================================

-- 1) cria profile no signup
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger trg_new_user after insert on auth.users
  for each row execute function handle_new_user();

-- 2) ao concluir aula → revisões (24h,7d,15d,30d,60d) + XP
create or replace function on_lesson_completed() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_base date; intervals int[] := array[1,7,15,30,60]; i int;
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    new.completed_at := coalesce(new.completed_at, now());
    v_base := new.completed_at::date;
    for i in 1..5 loop
      insert into revisions(user_id, lesson_id, stage, due_date)
      values (new.user_id, new.lesson_id, i, v_base + intervals[i])
      on conflict (user_id, lesson_id, stage) do nothing;
    end loop;
    perform award_xp(new.user_id, 'lesson', new.lesson_id, 10);
  end if;
  return new;
end; $$;
create trigger trg_lesson_completed before insert or update of status on lesson_progress
  for each row execute function on_lesson_completed();

-- 3) ao concluir revisão → XP
create or replace function on_revision_completed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'done' and old.status is distinct from 'done' then
    new.completed_at := coalesce(new.completed_at, now());
    perform award_xp(new.user_id, 'revision', new.lesson_id, 5);
  end if;
  return new;
end; $$;
create trigger trg_revision_completed before update of status on revisions
  for each row execute function on_revision_completed();

-- 4) ao responder questão → XP (e dispara checagem de conquistas via award_xp)
create or replace function on_question_answered() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform award_xp(new.user_id, 'question', new.question_id, case when new.is_correct then 2 else 1 end);
  return new;
end; $$;
create trigger trg_question_answered after insert on question_attempts
  for each row execute function on_question_answered();

-- 5) ao finalizar simulado → XP
create or replace function on_exam_finished() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'finished' and old.status is distinct from 'finished' then
    perform award_xp(new.user_id, 'exam', new.exam_id, 50);
  end if;
  return new;
end; $$;
create trigger trg_exam_finished after update of status on exam_attempts
  for each row execute function on_exam_finished();

-- 6) updated_at
create trigger trg_profiles_updated  before update on profiles  for each row execute function set_updated_at();
create trigger trg_courses_updated   before update on courses   for each row execute function set_updated_at();
create trigger trg_lessons_updated   before update on lessons   for each row execute function set_updated_at();
create trigger trg_lprog_updated     before update on lesson_progress for each row execute function set_updated_at();
create trigger trg_notes_updated     before update on user_notes for each row execute function set_updated_at();
create trigger trg_subs_updated      before update on subscriptions  for each row execute function set_updated_at();

-- =====================================================================
--  ROW LEVEL SECURITY
-- =====================================================================
alter table profiles               enable row level security;
alter table courses                enable row level security;
alter table modules                enable row level security;
alter table lessons                enable row level security;
alter table lesson_checklist_items enable row level security;
alter table flashcards             enable row level security;
alter table questions              enable row level security;
alter table answers                enable row level security;
alter table exams                  enable row level security;
alter table exam_questions         enable row level security;
alter table lesson_progress        enable row level security;
alter table study_plans            enable row level security;
alter table study_sessions         enable row level security;
alter table revisions              enable row level security;
alter table user_notes             enable row level security;
alter table user_highlights        enable row level security;
alter table user_favorites         enable row level security;
alter table question_attempts      enable row level security;
alter table exam_attempts          enable row level security;
alter table exam_attempt_answers   enable row level security;
alter table achievements           enable row level security;
alter table user_achievements      enable row level security;
alter table xp_events              enable row level security;
alter table subscriptions          enable row level security;
alter table payments               enable row level security;
alter table notifications          enable row level security;

-- ----- profiles: cada um vê/edita o seu -----
create policy profiles_select on profiles for select using (id = auth.uid());
create policy profiles_update on profiles for update using (id = auth.uid());
create policy profiles_insert on profiles for insert with check (id = auth.uid());

-- ----- conteúdo: leitura para autenticados (com gating de plano) -----
create policy courses_read on courses for select to authenticated
  using (is_published and has_plan_access(auth.uid(), min_plan));
create policy modules_read on modules for select to authenticated
  using (exists (select 1 from courses c where c.id = course_id
                 and c.is_published and has_plan_access(auth.uid(), c.min_plan)));
create policy lessons_read on lessons for select to authenticated
  using (is_published and exists (
    select 1 from modules m join courses c on c.id = m.course_id
    where m.id = module_id and c.is_published and has_plan_access(auth.uid(), c.min_plan)));
create policy checklist_read  on lesson_checklist_items for select to authenticated using (true);
create policy flashcards_read on flashcards for select to authenticated using (true);
create policy questions_read  on questions  for select to authenticated using (true);
create policy answers_read    on answers    for select to authenticated using (true);
create policy exams_read on exams for select to authenticated
  using (is_published and has_plan_access(auth.uid(), min_plan));
create policy examq_read on exam_questions for select to authenticated using (true);
-- (escrita em conteúdo: somente service role, que ignora RLS)

-- ----- conquistas: catálogo legível por todos -----
create policy achievements_read on achievements for select to authenticated using (true);

-- ----- tabelas por usuário: CRUD do próprio dado -----
-- macro-padrão aplicado individualmente abaixo
create policy lprog_all     on lesson_progress      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy plans_all      on study_plans          for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy sessions_all   on study_sessions       for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy revisions_all  on revisions            for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notes_all      on user_notes           for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy highlights_all on user_highlights      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy favorites_all  on user_favorites       for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy qattempt_all   on question_attempts    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy examatt_all    on exam_attempts        for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_all      on notifications        for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy uach_select    on user_achievements    for select using (user_id = auth.uid());
create policy xp_select      on xp_events            for select using (user_id = auth.uid());

-- exam_attempt_answers: via dono da tentativa
create policy examans_all on exam_attempt_answers for all
  using (exists (select 1 from exam_attempts ea where ea.id = exam_attempt_id and ea.user_id = auth.uid()))
  with check (exists (select 1 from exam_attempts ea where ea.id = exam_attempt_id and ea.user_id = auth.uid()));

-- cobrança: usuário só LÊ o que é seu; gravação só via service role (webhook)
create policy subs_select     on subscriptions for select using (user_id = auth.uid());
create policy payments_select on payments      for select using (user_id = auth.uid());

-- =====================================================================
--  VIEWS  (security_invoker => respeitam a RLS do chamador)
-- =====================================================================

-- revisões pendentes/atrasadas do usuário corrente
create view v_revisions_due with (security_invoker = on) as
select r.*, (r.due_date < current_date) as is_late
from revisions r
where r.user_id = auth.uid() and r.status <> 'done';

-- desempenho por disciplina do usuário corrente
create view v_discipline_performance with (security_invoker = on) as
select q.discipline,
       count(*)                                            as answered,
       count(*) filter (where qa.is_correct)               as correct,
       round(100.0 * count(*) filter (where qa.is_correct) / nullif(count(*),0), 1) as accuracy_pct,
       round(avg(qa.time_spent_seconds))                   as avg_seconds
from question_attempts qa
join questions q on q.id = qa.question_id
where qa.user_id = auth.uid()
group by q.discipline;

-- estatísticas-resumo p/ o dashboard (1 linha do usuário corrente)
create view v_dashboard_stats with (security_invoker = on) as
select
  p.id as user_id,
  p.xp,
  level_for_xp(p.xp)                          as level,
  p.current_streak,
  p.longest_streak,
  p.target_exam_date,
  greatest(p.target_exam_date - current_date, 0) as days_to_exam,
  (select count(*) from lesson_progress lp where lp.user_id = p.id and lp.status = 'completed') as lessons_completed,
  (select count(*) from revisions r where r.user_id = p.id and r.status = 'done')               as revisions_done,
  (select count(*) from revisions r where r.user_id = p.id and r.status <> 'done' and r.due_date < current_date) as revisions_late,
  (select count(*) from revisions r where r.user_id = p.id and r.status <> 'done' and r.due_date = current_date) as revisions_today,
  (select count(*) from question_attempts qa where qa.user_id = p.id) as questions_answered,
  (select round(100.0*count(*) filter (where qa.is_correct)/nullif(count(*),0),1)
     from question_attempts qa where qa.user_id = p.id)               as overall_accuracy_pct,
  (select coalesce(sum(ss.actual_minutes),0) from study_sessions ss where ss.user_id = p.id and ss.status='done') as minutes_studied
from profiles p
where p.id = auth.uid();

-- =====================================================================
--  SEED MÍNIMO — conquistas (Fase 10)
-- =====================================================================
insert into achievements(code, title, description, icon, xp_reward, criteria) values
  ('streak_7',     '7 dias seguidos',    'Estudou 7 dias consecutivos',        'flame',  50,  '{"type":"streak","value":7}'),
  ('streak_30',    '30 dias seguidos',   'Estudou 30 dias consecutivos',       'trophy', 200, '{"type":"streak","value":30}'),
  ('questions_100','100 questões',       'Respondeu 100 questões',             'target', 100, '{"type":"questions","value":100}'),
  ('questions_1000','1.000 questões',    'Respondeu 1.000 questões',           'crown',  500, '{"type":"questions","value":1000}')
on conflict (code) do nothing;

-- =====================================================================
--  FIM DA MIGRATION
--  Observações:
--   • Operações de admin (criar cursos/aulas/questões/simulados) e o
--     webhook da Stripe usam a SERVICE ROLE, que ignora a RLS.
--   • Ative Realtime nas tabelas que quiser refletir ao vivo
--     (ex.: notifications, lesson_progress) pelo painel do Supabase.
-- =====================================================================
