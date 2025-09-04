  -- Here are supabase sql table code

-- Users table
create table public.users (
  id uuid not null,
  email text null,
  last_sign_in timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  full_name text null,
  role text null default ''::text,
  avatar_url text null,
  is_onboarding_completed boolean not null default false,
  updated_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Functions
-- Handle auth user
create or replace function public.handle_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_full_name text;
  new_avatar_url text;
begin
  -- Extract full_name and avatar_url from raw_user_meta_data JSON
  new_full_name := (new.raw_user_meta_data->>'full_name');
  new_avatar_url := (new.raw_user_meta_data->>'avatar_url');

  -- If user already exists, update
  if exists(select 1 from public.users where id = new.id) then
    update public.users
      set last_sign_in = now(),
          email = new.email
    where id = new.id;
  else
    -- Otherwise, insert new user
    insert into public.users (id, email, full_name, avatar_url, last_sign_in)
    values (new.id, new.email, new_full_name, new_avatar_url, now());
  end if;

  return new;
end;
$$;


-- Handle auth user trigger
-- Trigger
create trigger on_auth_user
after insert or update
on auth.users
for each row
execute function public.handle_auth_user();


------------------------------------------------------------
  -- Employer and Candidate profile tables
------------------------------------------------------------

  -- Employer profiles
create table if not exists public.employer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  company_name text not null,
  company_size text null,
  industry text null,
  logo_url text null,
  website text null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text)
) TABLESPACE pg_default;

-- ensure one profile per user for upsert on conflict
do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'employer_profiles_user_id_key'
  ) then
    alter table public.employer_profiles add constraint employer_profiles_user_id_key unique (user_id);
  end if;
end $$;

-- Candidate profiles
create table if not exists public.candidate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  full_name text not null,
  resume_url text null,
  skills text[] not null default '{}',
  experience jsonb not null default '[]',
  education jsonb not null default '[]',
  projects jsonb not null default '[]',
  location text null,
  desired_salary numeric null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text)
) TABLESPACE pg_default;

-- ensure one profile per user for upsert on conflict
do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'candidate_profiles_user_id_key'
  ) then
    alter table public.candidate_profiles add constraint candidate_profiles_user_id_key unique (user_id);
  end if;
end $$;

-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at_employer on public.employer_profiles;
create trigger trg_set_updated_at_employer
before update on public.employer_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_candidate on public.candidate_profiles;
create trigger trg_set_updated_at_candidate
before update on public.candidate_profiles
for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.employer_profiles enable row level security;
alter table public.candidate_profiles enable row level security;

-- Policies: owner can CRUD own row
drop policy if exists employer_read on public.employer_profiles;
create policy employer_read on public.employer_profiles
  for select using (auth.uid() = user_id);

drop policy if exists employer_write on public.employer_profiles;
create policy employer_write on public.employer_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists candidate_read on public.candidate_profiles;
create policy candidate_read on public.candidate_profiles
  for select using (auth.uid() = user_id);

drop policy if exists candidate_write on public.candidate_profiles;
create policy candidate_write on public.candidate_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- Resumes table (per-user previous resumes)
------------------------------------------------------------
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  file_name text not null,
  file_url text not null,
  storage_path text not null,
  ats_optimization_checker_results jsonb null,
  resume_content text null,
  uploaded_at timestamp with time zone not null default now()
) TABLESPACE pg_default;

-- index and uniqueness helpers
create index if not exists resumes_user_id_idx on public.resumes (user_id);

do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'resumes_storage_path_key'
  ) then
    alter table public.resumes add constraint resumes_storage_path_key unique (storage_path);
  end if;
end $$;

-- Row Level Security for resumes
alter table public.resumes enable row level security;

drop policy if exists resumes_read on public.resumes;
create policy resumes_read on public.resumes
  for select using (auth.uid() = user_id);

drop policy if exists resumes_write on public.resumes;
create policy resumes_write on public.resumes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- Storage: avatars, resume, company_logo buckets
------------------------------------------------------------
-- Create avatars bucket (id = 'avatars')
select storage.create_bucket('avatars', public => true);
-- Create resume bucket (id = 'resume')
select storage.create_bucket('resume', public => true);
-- Create company logo bucket (id = 'company_logo')
select storage.create_bucket('company_logo', public => true);

-- Storage RLS policies for avatars: public read, users write to their own folder
drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

drop policy if exists "Users can manage their own avatar files" on storage.objects;
create policy "Users can manage their own avatar files"
  on storage.objects for all
  using (
    bucket_id = 'avatars' and
    (auth.role() = 'service_role' or (auth.uid() is not null and (
      -- path like `userId/*`
      (position(auth.uid()::text in name) = 1)
    )))
  ) with check (
    bucket_id = 'avatars' and
    (auth.role() = 'service_role' or (auth.uid() is not null and (
      (position(auth.uid()::text in name) = 1)
    )))
  );

-- Resume policies
drop policy if exists "Resume files are publicly readable" on storage.objects;
create policy "Resume files are publicly readable"
  on storage.objects for select
  using ( bucket_id = 'resume' );

drop policy if exists "Users can manage their own resume files" on storage.objects;
create policy "Users can manage their own resume files"
  on storage.objects for all
  using (
    bucket_id = 'resume' and
    (auth.role() = 'service_role' or (auth.uid() is not null and (
      (position(auth.uid()::text in name) = 1)
    )))
  ) with check (
    bucket_id = 'resume' and
    (auth.role() = 'service_role' or (auth.uid() is not null and (
      (position(auth.uid()::text in name) = 1)
    )))
  );

-- Company logo policies
drop policy if exists "Company logos are publicly readable" on storage.objects;
create policy "Company logos are publicly readable"
  on storage.objects for select
  using ( bucket_id = 'company_logo' );

drop policy if exists "Users can manage their own company logos" on storage.objects;
create policy "Users can manage their own company logos"
  on storage.objects for all
  using (
    bucket_id = 'company_logo' and
    (auth.role() = 'service_role' or (auth.uid() is not null and (
      (position(auth.uid()::text in name) = 1)
    )))
  ) with check (
    bucket_id = 'company_logo' and
    (auth.role() = 'service_role' or (auth.uid() is not null and (
      (position(auth.uid()::text in name) = 1)
    )))
  );