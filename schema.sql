-- Users (auth.users é gerenciado pelo Supabase Auth)

-- Profiles: dados adicionais do usuário
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  purchase_date timestamp with time zone,
  stripe_customer_id text unique,
  subscription_status text default 'inactive' check (subscription_status in ('inactive', 'active', 'cancelled', 'expired')),
  course_access_until timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Modules: módulos do curso (Português, Raciocínio Lógico, etc.)
create table public.modules (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  description text,
  order_index integer,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Lessons: aulas dentro dos módulos
create table public.lessons (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references public.modules(id) on delete cascade not null,
  slug text not null,
  title text not null,
  content text,
  video_url text,
  order_index integer,
  duration_minutes integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(module_id, slug)
);

-- Questions: banco de questões
create table public.questions (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references public.modules(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  question_text text not null,
  question_type text not null check (question_type in ('multiple_choice', 'true_false', 'essay')),
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  explanation text,
  source_ref text unique, -- id estável vindo do .md (seed idempotente)
  order_index integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Question Options: opções de resposta
create table public.question_options (
  id uuid default gen_random_uuid() primary key,
  question_id uuid references public.questions(id) on delete cascade not null,
  text text not null,
  is_correct boolean default false,
  order_index integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Progress: rastreamento de progresso
create table public.user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  completed boolean default false,
  completion_percentage integer default 0,
  last_accessed_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, lesson_id)
);

-- User Answers: respostas dos usuários aos questionários
create table public.user_answers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  selected_option_id uuid references public.question_options(id) on delete set null,
  is_correct boolean,
  attempted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Study Sessions: sessões de estudo (para rastreamento de horas)
create table public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  module_id uuid references public.modules(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  duration_minutes integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Exams/Simulations: simulados
create table public.exams (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  description text,
  exam_type text check (exam_type in ('simulation', 'practice')),
  total_questions integer,
  duration_minutes integer,
  passing_score integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Exam Results: resultados de simulados
create table public.user_exam_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  exam_id uuid references public.exams(id) on delete cascade not null,
  score integer,
  total_questions integer,
  percentage float,
  passed boolean,
  time_spent_minutes integer,
  started_at timestamp with time zone,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Exam Questions: vínculo simulado <-> questões (questões reutilizáveis)
create table public.exam_questions (
  id uuid default gen_random_uuid() primary key,
  exam_id uuid references public.exams(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  order_index integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (exam_id, question_id)
);

-- Helper de assinatura (security definer) — gate de conteúdo em uma função
-- indexada, evitando subquery correlacionada por linha nas policies.
create schema if not exists private;

create or replace function private.has_active_subscription()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and subscription_status = 'active'
  );
$$;

revoke execute on function private.has_active_subscription() from public, anon;
-- authenticated precisa de USAGE no schema + EXECUTE: o RLS chama a função no
-- contexto do usuário logado (o revoke de PUBLIC acima também o atingiria).
grant usage on schema private to authenticated;
grant execute on function private.has_active_subscription() to authenticated;

-- Cria profile automaticamente no signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_answers enable row level security;
alter table public.study_sessions enable row level security;
alter table public.exams enable row level security;
alter table public.user_exam_results enable row level security;
alter table public.exam_questions enable row level security;

-- RLS Policies
-- NB: usar (select auth.uid()) faz o valor ser avaliado uma vez por query
-- (cacheado), em vez de uma chamada por linha — ~100x em tabelas grandes.

create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Catálogo de módulos: visível a qualquer autenticado (browse antes de pagar)
create policy "Modules visible to authenticated"
  on public.modules for select to authenticated
  using (true);

-- Conteúdo (lições/questões/opções/simulados): exige assinatura ativa
create policy "Lessons require active subscription"
  on public.lessons for select to authenticated
  using ((select private.has_active_subscription()));

create policy "Questions require active subscription"
  on public.questions for select to authenticated
  using ((select private.has_active_subscription()));

create policy "Question options require active subscription"
  on public.question_options for select to authenticated
  using ((select private.has_active_subscription()));

create policy "Exams require active subscription"
  on public.exams for select to authenticated
  using ((select private.has_active_subscription()));

create policy "Exam questions require active subscription"
  on public.exam_questions for select to authenticated
  using ((select private.has_active_subscription()));

create policy "Users can view their own progress"
  on public.user_progress for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own progress"
  on public.user_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own progress"
  on public.user_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can view their own answers"
  on public.user_answers for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own answers"
  on public.user_answers for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can view their own study sessions"
  on public.study_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own study sessions"
  on public.study_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can view their own exam results"
  on public.user_exam_results for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own exam results"
  on public.user_exam_results for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Indexes para performance (FK não são indexadas automaticamente no Postgres)
create index idx_user_progress_user_id on public.user_progress(user_id);
create index idx_user_progress_lesson_id on public.user_progress(lesson_id);
create index idx_user_progress_module_id on public.user_progress(module_id);
create index idx_user_answers_user_id on public.user_answers(user_id);
create index idx_user_answers_question_id on public.user_answers(question_id);
create index idx_user_answers_selected_option on public.user_answers(selected_option_id);
create index idx_study_sessions_user_id on public.study_sessions(user_id);
create index idx_study_sessions_module_id on public.study_sessions(module_id);
create index idx_study_sessions_lesson_id on public.study_sessions(lesson_id);
create index idx_user_exam_results_user_id on public.user_exam_results(user_id);
create index idx_user_exam_results_exam_id on public.user_exam_results(exam_id);
create index idx_questions_module_id on public.questions(module_id);
create index idx_questions_lesson_id on public.questions(lesson_id);
create index idx_question_options_question_id on public.question_options(question_id);
create index idx_lessons_module_id on public.lessons(module_id);
create index idx_exam_questions_exam_id on public.exam_questions(exam_id);
create index idx_exam_questions_question_id on public.exam_questions(question_id);
