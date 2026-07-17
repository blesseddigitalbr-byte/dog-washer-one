create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trading_name text,
  description text,
  email text,
  phone text,
  website text,
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.legal_entities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_name text not null,
  trading_name text,
  tax_id text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  status text not null default 'active',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  legal_entity_id uuid references public.legal_entities(id) on delete set null,
  name text not null,
  code text not null unique,
  unit_type text not null default 'salon',
  cnpj text,
  razao_social text,
  address text,
  city text,
  state text,
  zip_code text,
  phone text,
  email text,
  manager_name text,
  manager_email text,
  status text not null default 'active',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  id_cliente text not null,
  nome text not null,
  email text,
  phone text,
  cpf text,
  cep text,
  logradouro text,
  numero text,
  complemento text,
  cidade text,
  uf text,
  is_vip boolean not null default false,
  is_model_dog boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (organization_id, id_cliente)
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  client_id uuid not null references public.clientes(id) on delete cascade,
  id_pet text not null,
  name text not null,
  breed text,
  size text,
  coat_type text,
  species text,
  sexo text,
  color text,
  birth_date date,
  weight numeric(8,2),
  microchip text,
  notes text,
  photo text,
  vaccines text,
  dewormed boolean not null default false,
  has_diseases_or_allergies boolean not null default false,
  diseases_or_allergies_description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (organization_id, id_pet)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  duration_minutes integer not null default 60,
  category text,
  metadata text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  cpf text,
  specialization text,
  status text not null default 'active',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  academic_id text,
  name text not null,
  email text,
  phone text,
  cpf text,
  photo_url text,
  course text,
  class_group text,
  academic_status text not null default 'active',
  enrollment_date timestamptz not null default now(),
  instructor_id uuid references public.professionals(id) on delete set null,
  is_authorized boolean not null default false,
  block_reason text,
  practice_level text not null default 'beginner',
  allowed_services text,
  allowed_dog_sizes text,
  needs_supervision boolean not null default true,
  can_work_alone boolean not null default false,
  notes text,
  data_origin text not null default 'manual',
  last_sync timestamptz,
  sync_status text not null default 'pending',
  status text not null default 'active',
  progress integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  name text not null,
  description text,
  total_baths integer not null default 0,
  total_groomings integer not null default 0,
  total_price numeric(12,2) not null default 0,
  monthly_price numeric(12,2) not null default 0,
  recurrence_type text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  client_id uuid not null references public.clientes(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  professional_id uuid references public.professionals(id) on delete set null,
  appointment_date timestamptz not null,
  start_time text,
  duration_minutes integer,
  status text not null default 'pending',
  notes text,
  cancellation_reason text,
  confirmed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index appointments_date_idx on public.appointments (appointment_date);

create table public.galeria_pets (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  url text not null,
  file_name text,
  file_size bigint,
  mime_type text,
  created_at timestamptz not null default now()
);

create table public.appointment_pets (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  sequence_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table public."appointmentStudents" (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  role text not null default 'executor',
  created_at timestamptz not null default now(),
  unique (appointment_id, student_id)
);

create table public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  reason text
);

create table public.package_sessions (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  session_type text not null,
  used_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
