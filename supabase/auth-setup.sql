-- =====================================================================
-- Auth setup — rode no Supabase SQL Editor (uma vez)
-- Cria automaticamente um registro em `profiles` quando um usuário se
-- cadastra, e permite o fallback de insert do próprio profile.
-- =====================================================================

-- Função que insere o profile do novo usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger: após criar usuário no auth, cria o profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Política de fallback: usuário pode inserir o próprio profile
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
