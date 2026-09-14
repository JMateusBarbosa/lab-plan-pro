create schema if not exists private;

create table if not exists public.laboratories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  school_name text not null,
  responsible text,
  phone text,
  city text not null,
  state text not null,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  computer_count integer not null check (computer_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'laboratory')),
  laboratory_id uuid references public.laboratories(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_laboratory_check check (
    (role = 'admin' and laboratory_id is null)
    or (role = 'laboratory' and laboratory_id is not null)
  )
);

create table if not exists public.laboratory_schedules (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null references public.laboratories(id) on delete restrict,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint laboratory_schedules_time_check check (end_time > start_time),
  constraint laboratory_schedules_unique_start unique (laboratory_id, day_of_week, start_time)
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  laboratory_id uuid not null references public.laboratories(id) on delete restrict,
  student_name text not null,
  module text not null,
  student_class_time time not null,
  exam_date date not null,
  pc_number integer not null check (pc_number > 0),
  exam_type text not null check (exam_type in ('p1', 'recuperacao')),
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'reprovado')),
  previous_exam_id uuid references public.exams(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exams_not_self_previous check (previous_exam_id is null or previous_exam_id <> id),
  constraint exams_unique_pc_slot unique (laboratory_id, exam_date, student_class_time, pc_number)
);

create index if not exists idx_profiles_laboratory_id on public.profiles(laboratory_id);
create index if not exists idx_laboratory_schedules_lab_day on public.laboratory_schedules(laboratory_id, day_of_week);
create index if not exists idx_exams_laboratory_id on public.exams(laboratory_id);
create index if not exists idx_exams_exam_date on public.exams(exam_date);
create index if not exists idx_exams_status on public.exams(status);
create index if not exists idx_exams_previous_exam_id on public.exams(previous_exam_id);

alter table public.profiles enable row level security;
alter table public.laboratories enable row level security;
alter table public.laboratory_schedules enable row level security;
alter table public.exams enable row level security;