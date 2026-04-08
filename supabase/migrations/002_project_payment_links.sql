alter table public.payments
  add column if not exists project_id uuid;

alter table public.projects
  add column if not exists linked_payment_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payments_project_id_fkey'
  ) then
    alter table public.payments
      add constraint payments_project_id_fkey
      foreign key (project_id)
      references public.projects(id)
      on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_linked_payment_id_fkey'
  ) then
    alter table public.projects
      add constraint projects_linked_payment_id_fkey
      foreign key (linked_payment_id)
      references public.payments(id)
      on delete set null;
  end if;
end $$;

create unique index if not exists idx_payments_project_id_unique
  on public.payments(project_id)
  where project_id is not null;

create unique index if not exists idx_projects_linked_payment_id_unique
  on public.projects(linked_payment_id)
  where linked_payment_id is not null;

create index if not exists idx_payments_project_id
  on public.payments(project_id);

create index if not exists idx_projects_linked_payment_id
  on public.projects(linked_payment_id);
