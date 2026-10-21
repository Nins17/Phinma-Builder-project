-- 006 — Manage records by section (Ticket 08)
--
-- Run this in Supabase -> SQL Editor -> New query -> paste -> Run.
-- Safe to run more than once. Needs 004 and 005 first.
-- Afterwards run:  notify pgrst, 'reload schema';

-- 1. Name and section can't be blank --------------------------------
--
-- The upload screen already checks this; now the database does too.

alter table student_records
  drop constraint if exists student_records_name_not_blank,
  add constraint student_records_name_not_blank check (student_name <> ''),
  drop constraint if exists student_records_section_not_blank,
  add constraint student_records_section_not_blank check (section <> '');

-- 2. Replace ONE section --------------------------------------------
--
-- Deletes the old records of that section only, then inserts the new
-- ones, as one all-or-nothing step. Other sections are not touched.
-- The section comes from what the teacher typed, not from the file.
-- Runs as the caller (security invoker), so the admin-only RLS
-- policies from 004 and 005 still apply.

create or replace function public.replace_section_records(
  p_section text,
  p_records jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_section text := upper(trim(p_section));
  v_clash   record;
  inserted  integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can change student records';
  end if;

  if v_section is null or v_section = '' then
    raise exception 'Type the section first';
  end if;

  if jsonb_typeof(p_records) <> 'array' or jsonb_array_length(p_records) = 0 then
    raise exception 'The upload has no students in it';
  end if;

  -- A student number may only belong to one section.
  select s.student_number, s.section into v_clash
  from public.student_records s
  join jsonb_array_elements(p_records) r
    on s.student_number = trim(r ->> 'student_number')
  where s.section <> v_section
  limit 1;

  if found then
    raise exception 'Student number % is already in section %. Remove it there first.',
      v_clash.student_number, v_clash.section;
  end if;

  delete from public.student_records where section = v_section;

  insert into public.student_records
    (student_number, student_name, section, code,
     wrapup_quizzes, wrapup_min_score, checkin_tests, checkin_min_score)
  select
    trim(r ->> 'student_number'),
    trim(r ->> 'student_name'),
    v_section,
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

-- 3. Remove ONE section ---------------------------------------------

create or replace function public.remove_section_records(p_section text)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  removed integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can change student records';
  end if;

  delete from public.student_records where section = upper(trim(p_section));

  get diagnostics removed = row_count;
  return removed;
end;
$$;

-- 4. The old "replace everything" function is no longer used --------
--
-- Dropping it means one wrong upload can never wipe every section.

drop function if exists public.replace_student_records(jsonb);

-- 5. Who may call what ----------------------------------------------
--
-- Supabase gives the public (anon) role its own permission on new
-- functions, so revoking from "public" alone is not enough (found in
-- /code-review). Only the lookup function is for students.

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.replace_section_records(text, jsonb) from public, anon;
grant execute on function public.replace_section_records(text, jsonb) to authenticated;

revoke all on function public.remove_section_records(text) from public, anon;
grant execute on function public.remove_section_records(text) to authenticated;
