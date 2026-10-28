-- 010 — Remarks students can see (Ticket 10)
--
-- Run this in Supabase -> SQL Editor -> New query -> paste -> Run.
-- Needs 009 first. Afterwards run:  notify pgrst, 'reload schema';

-- 1. The remarks column ---------------------------------------------
--
-- The teacher's note to the student for that subject, e.g. "Retake the
-- P1 check-in; score at least 70." Blank means no remark. Existing
-- records get a blank remark until their CSV is re-uploaded.

alter table student_records add column if not exists remarks text not null default '';

-- 2. Student lookup now also returns the remarks --------------------
--
-- Same rules as 008 (number AND code must match, never returns the
-- code). The return columns change, so the old version is dropped.

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
  checkin_min_score text,
  remarks           text
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.subject, r.student_name, r.section,
         r.wrapup_quizzes, r.wrapup_min_score,
         r.checkin_tests, r.checkin_min_score,
         r.remarks
  from public.student_records r
  where r.student_number = trim(p_student_number)
    and upper(r.code) = upper(trim(p_code))
  order by r.subject;
$$;

revoke all on function public.lookup_student_record(text, text) from public;
grant execute on function public.lookup_student_record(text, text) to anon, authenticated;

-- 3. Replace ONE section + subject: also saves remarks ---------------
--
-- Same as 009, plus the remarks column in the insert.

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
     wrapup_quizzes, wrapup_min_score, checkin_tests, checkin_min_score,
     remarks)
  select
    trim(r ->> 'student_number'),
    trim(r ->> 'student_name'),
    v_section,
    v_subject,
    trim(r ->> 'code'),
    coalesce(trim(r ->> 'wrapup_quizzes'), ''),
    coalesce(trim(r ->> 'wrapup_min_score'), ''),
    coalesce(trim(r ->> 'checkin_tests'), ''),
    coalesce(trim(r ->> 'checkin_min_score'), ''),
    coalesce(trim(r ->> 'remarks'), '')
  from jsonb_array_elements(p_records) as r;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

-- `create or replace` keeps the admin-only permissions set in 008.
