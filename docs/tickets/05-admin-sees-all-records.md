# 05 — Admin sees all records

**What to build:** On the dashboard, the teacher sees every student's
record, including their code, so they can tell a student a lost code.

**Blocked by:** 04

**Status:** done

- [x] Admins can read `student_records` (a new RLS policy that checks
      the `admins` table)
- [x] The dashboard shows a table of every student: student number,
      name, section, code, wrap-ups, min. score, check-ins, min. score
- [x] The dashboard shows when the records were last uploaded
- [x] Logged out, the records still can't be read
- [x] Works on the live URL
