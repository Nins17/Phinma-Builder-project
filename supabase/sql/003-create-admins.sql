-- 003 — Admins (Ticket 04)
--
-- Run this in Supabase -> SQL Editor -> New query -> paste -> Run.
-- Safe to run more than once.

-- 1. The table ------------------------------------------------------
--
-- One row per admin account. For the MVP that is only the teacher.
-- Being logged in is NOT enough to be an admin: your account ID must
-- also be in this table. Later policies (Tickets 05 and 06) check it.

create table if not exists admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 2. Row Level Security --------------------------------------------

alter table admins enable row level security;

-- A logged-in user may check whether THEIR OWN account is an admin.
-- They cannot see anyone else's row.
drop policy if exists "users can check their own admin row" on admins;
create policy "users can check their own admin row"
  on admins for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Deliberately NO insert, update or delete policy: nobody can make
-- themselves an admin through the website. The admin row is added by
-- hand in the SQL Editor (step 3).

-- 3. Make yourself the admin (run separately, NOT saved here) -------
--
-- After creating your account in Authentication -> Users, run this in
-- a new query with your real email. We don't keep the email in this
-- file because the repo is on GitHub.
--
--   insert into admins (user_id)
--   select id from auth.users where email = 'YOUR-EMAIL-HERE'
--   on conflict do nothing;
--
-- Check it worked (should return 1 row):
--   select * from admins;
