-- 009 — One clean-up rule for section and subject names (code review)
--
-- Run this in Supabase -> SQL Editor -> New query -> paste -> Run.
-- Needs 008 first. Afterwards run:  notify pgrst, 'reload schema';
--
-- Sections and subjects are stored in capitals with NO spaces, so
-- "bsit 1-6" and "BSIT1-6" are the same section, and "ite 260" and
-- "ITE260" the same subject. Before this, sections kept inner spaces.

-- 1. The rule, written once ----------------------------------------
--
-- Removes ordinary spaces, tabs, line breaks and the "non-breaking
-- space" Google Sheets sometimes pastes ( ), then uses capitals.
-- The website uses the same characters: cleanLabel() in upload-csv.ts.

create or replace function public.clean_label(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select upper(regexp_replace(p_value, '[ \t\n\r\f\v ]', '', 'g'));
$$;

revoke all on function public.clean_label(text) from public, anon;
grant execute on function public.clean_label(text) to authenticated;

-- 2. Clean what is already stored -----------------------------------

update public.student_records
set section = public.clean_label(section),
    subject = public.clean_label(subject)
where section <> public.clean_label(section)
   or subject <> public.clean_label(subject);

-- 3. Replace ONE section + subject (same as 008, using clean_label) --

create or replace function public.replace_section_records(
  p_section text,
  p_subject text,
  p_records jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_section text := public.clean_label(p_section);
  v_subject text := public.clean_label(p_subject);
  v_clash   record;
  inserted  integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can change student records';
  end if;

  if v_section is null or v_section = '' then
    raise exception 'Type the section first';
  end if;

  if v_subject is null or v_subject = '' then
    raise exception 'Type the subject first';
  end if;

  if jsonb_typeof(p_records) <> 'array' or jsonb_array_length(p_records) = 0 then
    raise exception 'The upload has no students in it';
  end if;

  -- a) One section per student per subject.
  select s.student_number, s.section into v_clash
  from public.student_records s
  join jsonb_array_elements(p_records) r
    on s.student_number = trim(r ->> 'student_number')
  where s.subject = v_subject and s.section <> v_section
  limit 1;

  if found then
    raise exception 'Student number % is already in section % for %. Re-upload that section''s CSV without this student first.',
      v_clash.student_number, v_clash.section, v_subject;
  end if;

  -- b) One code per student, across all their subjects.
  select s.student_number, s.subject into v_clash
  from public.student_records s
  join jsonb_array_elements(p_records) r
    on s.student_number = trim(r ->> 'student_number')
  where s.subject <> v_subject
    and upper(s.code) <> upper(trim(r ->> 'code'))
  limit 1;

  if found then
    raise exception 'Student number % has a different code in %. Each student must use the same code in every subject.',
      v_clash.student_number, v_clash.subject;
  end if;

  delete from public.student_records
  where section = v_section and subject = v_subject;

  insert into public.student_records
    (student_number, student_name, section, subject, code,
     wrapup_quizzes, wrapup_min_score, checkin_tests, checkin_min_score)
  select
    trim(r ->> 'student_number'),
    trim(r ->> 'student_name'),
    v_section,
    v_subject,
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

-- 4. Remove ONE section + subject (same as 008, using clean_label) ---

create or replace function public.remove_section_records(
  p_section text,
  p_subject text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_section text := public.clean_label(p_section);
  v_subject text := public.clean_label(p_subject);
  removed integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can change student records';
  end if;

  delete from public.student_records
  where section = v_section and subject = v_subject;

  get diagnostics removed = row_count;
  if removed = 0 then
    raise exception 'No records found for % %', v_section, v_subject;
  end if;
  return removed;
end;
$$;

-- `create or replace` keeps the admin-only permissions set in 008.

-- 5. Check it worked (run on its own) -------------------------------
--   select public.clean_label(' bsit 1-6 ');   -- should be BSIT1-6
