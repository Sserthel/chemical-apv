-- Kemisk APV: brugerprofiler med roller (admin / employee)
-- Kan køres flere gange (idempotent)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Brugere kan læse egen profil" on public.profiles;
create policy "Brugere kan læse egen profil"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Brugere kan oprette egen profil" on public.profiles;
create policy "Brugere kan oprette egen profil"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Brugere kan opdatere egen profil" on public.profiles;
create policy "Brugere kan opdatere egen profil"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Auto-opret profil ved ny bruger (admin for rasmus.berthel@gmail.com)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when lower(new.email) = 'rasmus.berthel@gmail.com' then 'admin'
      else 'employee'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
