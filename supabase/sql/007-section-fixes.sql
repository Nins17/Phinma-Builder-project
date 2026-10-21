-- 007 — Section fixes from /code-review (Ticket 08)
--
-- Run this in Supabase -> SQL Editor -> New query -> paste -> Run.
-- Safe to run more than once. Needs 006 first.
-- Afterwards run:  notify pgrst, 'reload schema';

-- 1. Store every section in capitals --------------------------------
--
-- Since 006, sections are always saved and matched in capitals. Older
-- rows saved another way (e.g. "bsit2-9") could not be replaced or
-- removed, so bring them in line.

update public.student_records
set section = upper(trim(section))
where section <> upper(trim(section));

-- 2. Replace ONE section: clearer clash message ---------------------
--
-- Same as 006, except the message now says what the teacher can
-- actually do (you can't remove a single student, only re-upload).

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
    raise exception 'Student number % is already in section %. Re-upload section %''s CSV without this student first.',
      v_clash.student_number, v_clash.section, v_clash.section;
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

-- 3. Remove ONE section: say so when nothing was removed ------------

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
  if removed = 0 then
    raise exception 'No records found for section %', upper(trim(p_section));
  end if;
  return removed;
end;
$$;

-- `create or replace` keeps the permissions set in 006 (admins only).
