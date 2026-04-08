-- Phase 3.4: Revenue Schedule & Upcoming Income
-- Adds payment_schedule as the explicit "planned future receipt" layer between
-- Projects (deals/opportunities) and Payments (received money ledger).

create table if not exists public.payment_schedule (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  project_id    uuid not null references public.projects(id) on delete cascade,
  amount        numeric(12,2) not null,
  currency      text not null default 'USD',
  expected_date date not null,
  status        text not null default 'scheduled'
                constraint payment_schedule_status_check
                check (status in ('scheduled', 'received', 'cancelled')),
  payment_id    uuid references public.payments(id) on delete set null,
  label         text,
  created_at    timestamptz default now()
);

-- Common access patterns
create index if not exists idx_payment_schedule_user_status
  on public.payment_schedule(user_id, status);

create index if not exists idx_payment_schedule_project
  on public.payment_schedule(project_id);

create index if not exists idx_payment_schedule_expected_date
  on public.payment_schedule(user_id, expected_date asc);

-- One payment closes at most one schedule entry
create unique index if not exists idx_payment_schedule_payment_id_unique
  on public.payment_schedule(payment_id)
  where payment_id is not null;

-- RLS: users can only access their own rows
alter table public.payment_schedule enable row level security;

create policy "own rows" on public.payment_schedule
  for all using (user_id = auth.uid());
