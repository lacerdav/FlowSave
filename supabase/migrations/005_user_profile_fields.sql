-- Migration 005: user profile fields
-- Adds first_name, last_name, freelance_role, primary_currency to users table.
-- All columns are nullable except primary_currency which defaults to 'USD' so
-- existing rows are unaffected.

alter table users
  add column if not exists first_name      text,
  add column if not exists last_name       text,
  add column if not exists freelance_role  text,
  add column if not exists primary_currency text not null default 'USD';
