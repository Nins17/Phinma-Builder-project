-- 002 — Student records + the student lookup function (Ticket 02)
--
-- Run this in Supabase -> SQL Editor -> New query -> paste -> Run.
-- Safe to run more than once.

-- 1. The table ------------------------------------------------------
--
-- One row per student, copied from the Upload tab of the Google Sheet.
-- Scores are plain text so values like "6 / 7" and "Aim high" work.
-- A blank retake column means "nothing to retake".

create table if not exists student_records (
  id                uuid primary key default gen_random_uuid(),
  student_number    text not null unique check (student_number <> ''),
  student_name      text not null,
  section           text not null,
  code              text not null check (code <> ''),
  wrapup_quizzes    text not null default '',
  wrapup_min_score  text not null default '',
  checkin_tests     text not null default '',
  checkin_min_score text not null default '',
  uploaded_at       timestamptz not null default now()
);

-- 2. Row Level Security --------------------------------------------
--
-- RLS ON, and deliberately NO policies yet. That means nobody using the
-- public (anon) key can read, add, change or delete any row. Students
-- never read this table directly; they go through the lookup function
-- below. The admin read/write policies come in Tickets 05 and 06.

alter table student_records enable row level security;

-- 3. The lookup function -------------------------------------------
--
-- The ONLY way a student can see a record. Give it a student number and
-- a code; it returns that one student's retakes, or nothing at all.
--
-- `security definer` lets the function read the table even though RLS
-- blocks the student. That is safe because the function itself decides
-- exactly what comes out: one matching row, and never the code.
-- `set search_path = ''` stops anyone tricking it into using a
-- look-alike table, which is why the table name is written in full.

create or replace function public.lookup_student_record(
  p_student_number text,
  p_code text
)
returns table (
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
  select r.student_name, r.section,
         r.wrapup_quizzes, r.wrapup_min_score,
         r.checkin_tests, r.checkin_min_score
  from public.student_records r
  where r.student_number = trim(p_student_number)
    and upper(r.code) = upper(trim(p_code))
  limit 1;
$$;

-- By default every role may call a new function. Take that away, then
-- allow only the website's two roles.
revoke all on function public.lookup_student_record(text, text) from public;
grant execute on function public.lookup_student_record(text, text) to anon, authenticated;

-- 4. Two FAKE test students ----------------------------------------
--
-- Made-up data so we can test before the real upload (Ticket 07 replaces
-- them). Never put real student data in this file — it is on GitHub.

insert into student_records
  (student_number, student_name, section, code,
   wrapup_quizzes, wrapup_min_score, checkin_tests, checkin_min_score)
values
  ('00-0000-000001', 'TEST, STUDENT ONE', 'BSIT2-9', 'TEST01',
   'M1, M3', '6 / 7', 'P1 check-in', '87 / 100'),
  ('00-0000-000002', 'TEST, STUDENT TWO', 'BSIT2-9', 'TEST02',
   '', '', '', '')
on conflict (student_number) do nothing;

-- 5. Check it worked -----------------------------------------------
--
-- Run this on its own; it should return TEST, STUDENT ONE's retakes:
--   select * from lookup_student_record('00-0000-000001', 'test01');
-- And this should return no rows:
--   select * from lookup_student_record('00-0000-000001', 'WRONG1');
