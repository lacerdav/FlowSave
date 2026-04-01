-- migrations/001_init.sql
-- FlowSave initial schema

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now(),
  stripe_customer_id text,
  plan text not null default 'free' check (plan in ('free', 'pro'))
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  currency text not null default 'USD',
  created_at timestamptz default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  received_at date not null,
  notes text,
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  name text not null,
  expected_amount numeric(12,2) not null,
  expected_date date not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'received', 'cancelled')),
  created_at timestamptz default now()
);

create table settings (
  user_id uuid primary key references users(id) on delete cascade,
  target_monthly_salary numeric(12,2) not null default 0,
  tax_reserve_pct numeric(5,2) not null default 25,
  survival_budget numeric(12,2) not null default 0,
  onboarding_completed boolean not null default false,
  lean_alert_sent_at timestamptz,
  ai_insight_cache text,
  ai_insight_cached_at timestamptz,
  updated_at timestamptz default now()
);

-- Indexes
create index idx_payments_user_date on payments(user_id, received_at desc);
create index idx_projects_user_status on projects(user_id, status);

-- Row Level Security
alter table users enable row level security;
alter table clients enable row level security;
alter table payments enable row level security;
alter table projects enable row level security;
alter table settings enable row level security;

create policy "own rows" on users for all using (id = auth.uid());
create policy "own rows" on clients for all using (user_id = auth.uid());
create policy "own rows" on payments for all using (user_id = auth.uid());
create policy "own rows" on projects for all using (user_id = auth.uid());
create policy "own rows" on settings for all using (user_id = auth.uid());
