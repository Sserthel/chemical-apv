-- Delt data: risikovurderinger + uploadede kemikalier (synk på tværs af enheder)

create table if not exists public.risk_assessments (
  id text primary key,
  chemical_id text not null,
  product_name text not null,
  status text not null default 'udkast'
    check (status in ('udkast', 'klar', 'publiceret')),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists risk_assessments_chemical_id_idx
  on public.risk_assessments (chemical_id);

create index if not exists risk_assessments_status_idx
  on public.risk_assessments (status);

create table if not exists public.chemical_uploads (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  )
  or exists (
    select 1
    from auth.users
    where id = auth.uid()
      and lower(email) = 'rasmus.berthel@gmail.com'
  );
$$;

alter table public.risk_assessments enable row level security;
alter table public.chemical_uploads enable row level security;

drop policy if exists "risk_assessments_select" on public.risk_assessments;
create policy "risk_assessments_select"
  on public.risk_assessments
  for select
  to authenticated
  using (status = 'publiceret' or public.is_admin());

drop policy if exists "risk_assessments_admin_write" on public.risk_assessments;
create policy "risk_assessments_admin_write"
  on public.risk_assessments
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "risk_assessments_admin_update" on public.risk_assessments;
create policy "risk_assessments_admin_update"
  on public.risk_assessments
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "risk_assessments_admin_delete" on public.risk_assessments;
create policy "risk_assessments_admin_delete"
  on public.risk_assessments
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "chemical_uploads_select" on public.chemical_uploads;
create policy "chemical_uploads_select"
  on public.chemical_uploads
  for select
  to authenticated
  using (true);

drop policy if exists "chemical_uploads_admin_insert" on public.chemical_uploads;
create policy "chemical_uploads_admin_insert"
  on public.chemical_uploads
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "chemical_uploads_admin_update" on public.chemical_uploads;
create policy "chemical_uploads_admin_update"
  on public.chemical_uploads
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "chemical_uploads_admin_delete" on public.chemical_uploads;
create policy "chemical_uploads_admin_delete"
  on public.chemical_uploads
  for delete
  to authenticated
  using (public.is_admin());
