-- Users (auth.users é gerenciado pelo Supabase Auth)

-- Profiles: dados adicionais do usuário
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  purchase_date timestamp with time zone,
  stripe_customer_id text unique,
  subscription_status text default 'inactive' check (subscription_status in ('active', 'cancelled', 'expired')),
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

-- RLS Policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Public modules are visible to authenticated users"
  on public.modules for select
  using (auth.role() = 'authenticated');

create policy "Public lessons are visible to authenticated users with active subscription"
  on public.lessons for select
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and subscription_status = 'active'
    )
  );

create policy "Users can view their own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Users can update their own progress"
  on public.user_progress for update
  using (auth.uid() = user_id);

create policy "Users can view their own answers"
  on public.user_answers for select
  using (auth.uid() = user_id);

create policy "Users can insert their own answers"
  on public.user_answers for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own study sessions"
  on public.study_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own study sessions"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can view exam results"
  on public.user_exam_results for select
  using (auth.uid() = user_id);

-- Indexes para performance
create index idx_user_progress_user_id on public.user_progress(user_id);
create index idx_user_progress_lesson_id on public.user_progress(lesson_id);
create index idx_user_answers_user_id on public.user_answers(user_id);
create index idx_study_sessions_user_id on public.study_sessions(user_id);
create index idx_user_exam_results_user_id on public.user_exam_results(user_id);
create index idx_questions_module_id on public.questions(module_id);
create index idx_lessons_module_id on public.lessons(module_id);
