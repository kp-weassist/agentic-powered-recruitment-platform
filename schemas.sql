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
  resume_data jsonb null,
  is_deleted boolean not null default false,
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

------------------------------------------------------------
-- Assessments: templates, instances, questions, attempts, answers
------------------------------------------------------------

-- Templates for skill assessments (seeded with 10 common skills)
create table if not exists public.assessment_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('technical','soft')),
  description text null,
  default_time_limit_seconds integer not null default 1200,
  skill_tags text[] not null default '{}',
  created_at timestamp with time zone not null default now()
) TABLESPACE pg_default;

do $$ begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'assessment_templates_name_key'
  ) then
    alter table public.assessment_templates add constraint assessment_templates_name_key unique (name);
  end if;
end $$;

-- Seed 10 templates (5 technical, 5 soft)
insert into public.assessment_templates (name, category, description, default_time_limit_seconds, skill_tags)
values
  ('JavaScript Fundamentals','technical','Core JS concepts: types, scope, async.', 1500, ARRAY['javascript','es6','async','dom']),
  ('Python Essentials','technical','Syntax, data structures, modules.', 1500, ARRAY['python','stdlib','data-structures']),
  ('SQL & Data Queries','technical','SELECTs, joins, aggregation, indexing.', 1500, ARRAY['sql','joins','aggregation','indexes']),
  ('React Basics','technical','Components, state, props, hooks.', 1500, ARRAY['react','hooks','jsx']),
  ('Data Structures & Algorithms','technical','Complexity, arrays, trees, graphs.', 1800, ARRAY['dsa','complexity','algorithms']),
  ('Communication','soft','Clarity, empathy, stakeholder alignment.', 900, ARRAY['communication','writing','listening']),
  ('Problem Solving','soft','Structured thinking and solutioning.', 900, ARRAY['problem-solving','analysis']),
  ('Leadership','soft','Influence, decision-making, ownership.', 900, ARRAY['leadership','ownership']),
  ('Teamwork','soft','Collaboration, conflict resolution.', 900, ARRAY['teamwork','collaboration']),
  ('Adaptability','soft','Handling change and ambiguity.', 900, ARRAY['adaptability','resilience'])
on conflict (name) do nothing;

-- Assessment instances assigned to a user
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  template_ids uuid[] not null default '{}',
  resume_id uuid null references public.resumes (id) on delete set null,
  jd text not null,
  title text not null,
  category text not null default 'composite',
  total_questions integer not null default 0,
  time_limit_seconds integer not null default 1800,
  status text not null default 'assigned' check (status in ('assigned','in_progress','completed','expired','cancelled')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text)
) TABLESPACE pg_default;

create index if not exists assessments_user_id_idx on public.assessments (user_id, created_at desc);

-- Questions per assessment
create table if not exists public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  question_index integer not null,
  question_type text not null check (question_type in ('multiple_choice','coding','scenario')),
  question text not null,
  options jsonb null,
  correct_options jsonb null,
  language text null,
  starter_code text null,
  max_score numeric not null default 1,
  rubric jsonb null,
  metadata jsonb null,
  created_at timestamp with time zone not null default now()
) TABLESPACE pg_default;

create index if not exists assessment_questions_assessment_idx on public.assessment_questions (assessment_id, question_index);

-- Attempts and answers
create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  started_at timestamp with time zone not null default now(),
  submitted_at timestamp with time zone null,
  time_remaining_seconds integer null,
  status text not null default 'in_progress' check (status in ('in_progress','submitted','graded','expired','cancelled')),
  score_total numeric null,
  score_technical numeric null,
  score_soft numeric null,
  ai_eval jsonb null,
  report jsonb null
) TABLESPACE pg_default;

create index if not exists assessment_attempts_user_idx on public.assessment_attempts (user_id, started_at desc);
create index if not exists assessment_attempts_assessment_idx on public.assessment_attempts (assessment_id);

create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.assessment_attempts (id) on delete cascade,
  question_id uuid not null references public.assessment_questions (id) on delete cascade,
  answer_data jsonb not null,
  is_correct boolean null,
  score numeric null,
  ai_feedback jsonb null,
  created_at timestamp with time zone not null default now()
) TABLESPACE pg_default;

create index if not exists assessment_answers_attempt_idx on public.assessment_answers (attempt_id);

-- RLS
alter table public.assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_answers enable row level security;

-- Policies: candidate can access their own assessments and related questions/answers
drop policy if exists assessments_read on public.assessments;
create policy assessments_read on public.assessments for select using (auth.uid() = user_id);

drop policy if exists assessments_write on public.assessments;
create policy assessments_write on public.assessments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists assessment_questions_read on public.assessment_questions;
create policy assessment_questions_read on public.assessment_questions for select using (
  exists(select 1 from public.assessments a where a.id = assessment_id and a.user_id = auth.uid())
);

drop policy if exists assessment_attempts_read on public.assessment_attempts;
create policy assessment_attempts_read on public.assessment_attempts for select using (auth.uid() = user_id);

drop policy if exists assessment_attempts_write on public.assessment_attempts;
create policy assessment_attempts_write on public.assessment_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists assessment_answers_read on public.assessment_answers;
create policy assessment_answers_read on public.assessment_answers for select using (
  exists(select 1 from public.assessment_attempts att where att.id = attempt_id and att.user_id = auth.uid())
);

drop policy if exists assessment_answers_write on public.assessment_answers;
create policy assessment_answers_write on public.assessment_answers for all using (
  exists(select 1 from public.assessment_attempts att where att.id = attempt_id and att.user_id = auth.uid())
) with check (
  exists(select 1 from public.assessment_attempts att where att.id = attempt_id and att.user_id = auth.uid())
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

------------------------------------------------------------
-- Resume + JD Analysis History
------------------------------------------------------------
create table if not exists public.resume_jd_analysis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  resume_id uuid null references public.resumes (id) on delete set null,
  jd text not null,
  analysis jsonb not null,
  created_at timestamp with time zone not null default now()
) TABLESPACE pg_default;

create index if not exists rjah_user_created_idx on public.resume_jd_analysis_history (user_id, created_at desc);
create index if not exists rjah_resume_idx on public.resume_jd_analysis_history (resume_id);

alter table public.resume_jd_analysis_history enable row level security;

drop policy if exists rjah_read on public.resume_jd_analysis_history;
create policy rjah_read on public.resume_jd_analysis_history
  for select using (auth.uid() = user_id);

drop policy if exists rjah_write on public.resume_jd_analysis_history;
create policy rjah_write on public.resume_jd_analysis_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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