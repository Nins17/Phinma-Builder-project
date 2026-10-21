-- 005 — Admins can replace all student records (Ticket 06)
--
-- Run this in Supabase -> SQL Editor -> New query -> paste -> Run.
-- Safe to run more than once. Needs 004 (is_admin) first.

-- 1. Policies --------------------------------------------------------
--
-- Admins may add and delete rows. Nobody else can. There is still no
-- update policy: records change only by replacing the whole upload.

drop policy if exists "admins can add student records" on student_records;
create policy "admins can add student records"
  on student_records for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "admins can delete student records" on student_records;
create policy "admins can delete student records"
  on student_records for delete
  to authenticated
  using ((select public.is_admin()));

-- 2. The replace function -------------------------------------------
--
-- Takes the whole upload as a list of students and swaps the old
-- records for the new ones. A database function runs as ONE step: if
-- anything fails (a duplicate student number, a missing code), the
-- delete is undone too and the old records stay exactly as they were.
--
-- `security invoker` means it runs as the person calling it, so the
-- RLS policies above still apply. A non-admin is also stopped by the
-- explicit check at the top.

create or replace function public.replace_student_records(p_records jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can replace student records';
  end if;

  if jsonb_typeof(p_records) <> 'array' or jsonb_array_length(p_records) = 0 then
    raise exception 'The upload has no students in it';
  end if;

  delete from public.student_records where true;

  insert into public.student_records
    (student_number, student_name, section, code,
     wrapup_quizzes, wrapup_min_score, checkin_tests, checkin_min_score)
  select
    trim(r ->> 'student_number'),
    trim(r ->> 'student_name'),
    trim(r ->> 'section'),
    trim(r ->> 'code'),
    coalesce(trim(r ->> 'wrapup_quizzes'), ''),
    coalesce(trim(r ->> 'wrapup_min_score'), ''),
    coalesce(trim(r ->> 'checkin_tests'), ''),
    coalesce(trim(r ->> 'checkin_min_score'), '')
  from jsonb_array_elements(p_records) as r;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

revoke all on function public.replace_student_records(jsonb) from public;
grant execute on function public.replace_student_records(jsonb) to authenticated;
