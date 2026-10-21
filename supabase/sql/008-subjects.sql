-- 008 — Subjects (Ticket 09)
--
-- Run this in Supabase -> SQL Editor -> New query -> paste -> Run.
-- Needs 007 first. Afterwards run:  notify pgrst, 'reload schema';
--
-- A record now belongs to a section + subject. One student can have a
-- record in several subjects, all with the SAME code.

-- 1. The subject column ---------------------------------------------
--
-- Existing records (BSIT2-9) are all ITE300.
-- Subjects are stored in capitals with no spaces: "ite 260" -> "ITE260",
-- so the same subject can't appear twice because of a stray space.

alter table student_records add column if not exists subject text not null default '';

update student_records set subject = 'ITE300' where subject = '';

alter table student_records
  alter column subject drop default,
  drop constraint if exists student_records_subject_not_blank,
  add constraint student_records_subject_not_blank check (subject <> '');

-- 2. One record per student PER SUBJECT ----------------------------
--
-- Before: a student number could appear only once in the whole table.
-- Now: once per subject.

alter table student_records
  drop constraint if exists student_records_student_number_key,
  drop constraint if exists student_records_number_subject_key,
  add constraint student_records_number_subject_key unique (student_number, subject);

-- 3. Student lookup: return every subject that matches -------------
--
-- Same rules as before (number AND code must match, the code is never
-- returned), but now it returns one row per subject so the student can
-- choose. The return columns change, so the old version is dropped.

drop function if exists public.lookup_student_record(text, text);

create function public.lookup_student_record(
  p_student_number text,
  p_code text
)
returns table (
  subject           text,
  student_name      text,
  section           text,
  wrapup_quizzes    text,
  wrapup_min_score  text,
  checkin_tests     text,
  checkin_min_score text
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.subject, r.student_name, r.section,
         r.wrapup_quizzes, r.wrapup_min_score,
         r.checkin_tests, r.checkin_min_score
  from public.student_records r
  where r.student_number = trim(p_student_number)
    and upper(r.code) = upper(trim(p_code))
  order by r.subject;
$$;

revoke all on function public.lookup_student_record(text, text) from public;
grant execute on function public.lookup_student_record(text, text) to anon, authenticated;

-- 4. Replace ONE section + subject ---------------------------------
--
-- Like 007, plus a subject. Two checks run before anything is deleted:
--   a) the student isn't already in ANOTHER section for this subject
--   b) the student's code matches their code in their other subjects
--      (one code per student)

drop function if exists public.replace_section_records(text, jsonb);

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
  v_section text := upper(trim(p_section));
  v_subject text := upper(regexp_replace(p_subject, '\s', '', 'g'));
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

-- 5. Remove ONE section + subject ----------------------------------

drop function if exists public.remove_section_records(text);

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
  v_section text := upper(trim(p_section));
  v_subject text := upper(regexp_replace(p_subject, '\s', '', 'g'));
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

-- 6. Who may call what (admins only, as in 006) ---------------------

revoke all on function public.replace_section_records(text, text, jsonb) from public, anon;
grant execute on function public.replace_section_records(text, text, jsonb) to authenticated;

revoke all on function public.remove_section_records(text, text) from public, anon;
grant execute on function public.remove_section_records(text, text) to authenticated;
