-- 004 — Admins can read student records (Ticket 05)
--
-- Run this in Supabase -> SQL Editor -> New query -> paste -> Run.
-- Safe to run more than once.

-- 1. A helper: "is the logged-in user an admin?" --------------------
--
-- Returns true only if the current account is in the admins table.
-- Policies on other tables call this, so the admin rule lives in one
-- place. `security definer` lets it look in admins regardless of who
-- is asking; it only ever answers true or false.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 2. The policy ------------------------------------------------------
--
-- Admins may read every row of student_records (including codes, so
-- the teacher can tell a student a lost code). Everyone else still
-- sees nothing: students only ever go through lookup_student_record.

drop policy if exists "admins can read student records" on student_records;
create policy "admins can read student records"
  on student_records for select
  to authenticated
  using ((select public.is_admin()));

-- 3. Check it worked -------------------------------------------------
--
-- In the website: log in at /admin and you should see the 2 fake
-- students. Logged out, the table must still return nothing.
