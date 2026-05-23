-- ============================================================
-- AI-RepCoach — Schéma initial
-- Séparation stricte : programme PRESCRIT vs performances RÉELLES
-- ============================================================

-- Extension UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- Table : users
-- ============================================================
create table public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  full_name     text not null,
  age           integer,
  height_cm     numeric(5,2),
  weight_kg     numeric(5,2),
  goal_weight_kg numeric(5,2),
  created_at    timestamptz default now()
);

-- Synchroniser avec Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Table : programs
-- ============================================================
create table public.programs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  name        text not null,
  description text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ============================================================
-- Table : workout_days
-- ============================================================
create table public.workout_days (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references public.programs(id) on delete cascade,
  name        text not null,
  day_order   integer not null,
  notes       text
);

-- ============================================================
-- Table : exercises (catalogue global)
-- ============================================================
create table public.exercises (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null unique,
  muscle_group          text not null,
  equipment             text,
  default_rest_seconds  integer default 90,
  joint_notes           text
);

-- ============================================================
-- Table : sets_config (programme PRESCRIT)
-- ============================================================
create table public.sets_config (
  id                uuid primary key default gen_random_uuid(),
  workout_day_id    uuid not null references public.workout_days(id) on delete cascade,
  exercise_id       uuid not null references public.exercises(id),
  exercise_order    integer not null,
  sets_count        integer not null,
  rep_range_min     integer not null,
  rep_range_max     integer not null,
  rest_seconds      integer not null,
  initial_weight_kg numeric(5,2),
  current_weight_kg numeric(5,2)
);

-- ============================================================
-- Table : workouts (instance de séance réelle)
-- ============================================================
create table public.workouts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  workout_day_id  uuid not null references public.workout_days(id),
  started_at      timestamptz default now(),
  ended_at        timestamptz,
  notes           text
);

-- ============================================================
-- Table : set_logs (performances RÉELLES — immuables)
-- ============================================================
create table public.set_logs (
  id                   uuid primary key default gen_random_uuid(),
  workout_id           uuid not null references public.workouts(id) on delete cascade,
  sets_config_id       uuid not null references public.sets_config(id),
  set_number           integer not null,
  weight_kg            numeric(5,2) not null,
  reps_done            integer not null,
  rest_taken_seconds   integer,
  logged_at            timestamptz default now()
);

-- ============================================================
-- Index de performance
-- ============================================================
create index idx_workouts_user    on public.workouts(user_id, started_at desc);
create index idx_set_logs_config  on public.set_logs(sets_config_id, logged_at desc);
create index idx_set_logs_workout on public.set_logs(workout_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.users        enable row level security;
alter table public.programs     enable row level security;
alter table public.workout_days enable row level security;
alter table public.sets_config  enable row level security;
alter table public.workouts     enable row level security;
alter table public.set_logs     enable row level security;
alter table public.exercises    enable row level security;

-- Users : chacun voit uniquement son profil
create policy "users_own" on public.users
  for all using (auth.uid() = id);

-- Programs : propriétaire uniquement
create policy "programs_own" on public.programs
  for all using (auth.uid() = user_id);

-- Workout days : via le programme du user
create policy "workout_days_own" on public.workout_days
  for all using (
    exists (
      select 1 from public.programs
      where id = program_id and user_id = auth.uid()
    )
  );

-- Sets config : via workout_day du user
create policy "sets_config_own" on public.sets_config
  for all using (
    exists (
      select 1 from public.workout_days wd
      join public.programs p on p.id = wd.program_id
      where wd.id = workout_day_id and p.user_id = auth.uid()
    )
  );

-- Workouts : propriétaire uniquement
create policy "workouts_own" on public.workouts
  for all using (auth.uid() = user_id);

-- Set logs : via workout du user
create policy "set_logs_own" on public.set_logs
  for all using (
    exists (
      select 1 from public.workouts
      where id = workout_id and user_id = auth.uid()
    )
  );

-- Exercises : lecture publique (catalogue global)
create policy "exercises_read" on public.exercises
  for select using (true);
