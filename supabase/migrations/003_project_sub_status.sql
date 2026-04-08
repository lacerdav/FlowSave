-- Allow pending projects to have no amount or date yet
alter table public.projects
  alter column expected_amount drop not null,
  alter column expected_date   drop not null;

-- Sub-state for pending projects: prospecting | negotiating
alter table public.projects
  add column if not exists sub_status text
  constraint projects_sub_status_check
  check (sub_status in ('prospecting', 'negotiating'));
