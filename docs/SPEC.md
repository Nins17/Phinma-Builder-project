# Spec: Retries Checker (ITE260, ITE300, ITE366)

## Problem
When P2 results come out, the teacher's ITE260, ITE300 and ITE366
students don't know which wrap-up
quizzes and check-in tests they need to retake, or what score they need.
Each of about 200 students sends the teacher a private message to ask,
which floods the teacher's inbox. The teacher can't share the Google
Sheet because it shows every student's grades.

## Solution
A student opens the website, types their student number and secret code,
and sees only their own retakes: the wrap-up quizzes and check-ins to
retake, with the min. score for each. Students who have nothing to retake
are told they're all clear. The teacher keeps working in Google Sheets
and uploads the Upload tab as a CSV whenever the list changes.

## The user
**Students** in the teacher's classes: BSIT1-20 · ITE260, BSIT1-6 ·
ITE260, BSIT1-6 · ITE366, BSIT2-6 · ITE300 and BSIT2-9 · ITE300. A
student can be in several of them. The teacher is the
single **admin** who keeps the data current. The admin isn't a second
type of user the MVP is built for. The admin side exists only to feed
the student lookup.

## User stories
1. As a student, I want to enter my student number and code, so that I
   can see which wrap-up quizzes and check-ins I must retake without
   messaging my teacher.
2. As a student, I want to see the min. score for each retake, so that I
   know what I have to reach.
3. As a student with nothing to retake, I want to be told I'm all clear,
   so that I don't have to ask.
4. As a student, I want a wrong number or code to show nothing, so that
   classmates can't see my record.
5. As the admin, I want to log in with my email and password, so that
   only I can manage the records.
6. As the admin, I want to upload my Upload tab as a CSV and replace all
   records in one go, so that students always see my latest list.
7. As the admin, I want to see every record including codes, so that I
   can tell a student their code if they lose it.

## Screens
1. **Check my retakes (home, students):** Student Number and Code boxes
   and a Check button. The code is hidden as dots while typing, with a
   Show/Hide button. No student list and no names on this page.
   If the student has records in more than one subject, they next see
   "Which subject do you want to check?" with a button for each of their
   own subjects (Ticket 09). With one subject, it opens straight away.
2. **My retakes (student result):** student name, section and subject,
   with Check another subject when they have several, plus Wrap-Up
   Quizzes to Retake with min. score, Check-ins to Retake with min.
   score, or "No retakes, you're all clear 🎉". Then the teacher's
   Remarks for that subject, if any (Ticket 10). Also shows "P2 status is
   not final." and a Check another button. A wrong number or code shows
   only "No match. Check your student number and code." It never says
   which one was wrong.
3. **Admin login:** email and password. Only the admin's account works.
4. **Admin dashboard:** (updated by Tickets 08 and 09). Since Ticket 09
   everything below works per **section + subject** (e.g. BSIT1-6 ·
   ITE260): Add record asks for both, and each section + subject has
   its own row, Replace all records and Remove buttons.
   - **Add record**: the teacher types the section and subject and
     chooses their CSV. The preview says, for example, "55 students found
     for BSIT2-9 · ITE300, 0 problems. This will replace the 55 current
     BSIT2-9 · ITE300 records." Saving replaces only that section +
     subject, in one go, and if the file has a problem nothing changes.
     If the file has its own Section or Subject column, it must match
     what was typed. Spaces are ignored: "bsit 1-6" means BSIT1-6.
   - **Download CSV template**: a CSV with the right headings.
   - **A list of sections and subjects**, sorted, e.g. "BSIT2-9 ·
     ITE300". Each row shows the student count and last upload time.
     Clicking it opens its records table (codes included), its own
     **Replace all records** button (section and subject filled in and
     locked), and a **Remove** button that asks for confirmation first.
   - **A note** explaining that to change a record, the teacher edits the
     CSV and re-uploads it with that section + subject's Replace all
     records.
     Records are never edited on screen.
   - A **Log out** button.

## Data

**Table `student_records`** has one row per student per subject.
Columns come from the Upload tab and are stored as plain text, so values
like `6 / 7` and `Aim high` work.
- `id`: unique row ID
- `student_number`: unique per subject (one record per student per
  subject). Matched exactly, ignoring spaces at the start and end.
- `student_name`
- `section`: e.g. BSIT2-9, stored in capitals without spaces
- `subject`: e.g. ITE260, stored in capitals without spaces (Ticket 09)
- `code`: the secret code. One code per student, the same in every
  subject (checked on upload). Matched ignoring upper/lower case.
- `wrapup_quizzes`: e.g. "M1, M3". Blank means none.
- `wrapup_min_score`: e.g. "6 / 7"
- `checkin_tests`: e.g. "P1 check-in, P2 check-in". Blank means none.
- `checkin_min_score`: e.g. "87 / 100" or "Aim high"
- `remarks`: the teacher's note to the student, shown to them (Ticket
  10). Optional in the CSV; blank means none.
- `uploaded_at`: when this row was uploaded

Who may read and write (Row Level Security ON):
- **Admin only** may read, insert and delete rows.
- **Students and the public may not read the table at all.**
- Students look up a record only through one database **lookup
  function**. It takes a student number and a code and returns only that
  student's records: one row per subject, with the subject, section,
  name, retakes, min. scores and remarks. It never returns the code or anyone
  else's rows. A wrong number or code returns nothing.
- Replacing a section + subject happens as a single all-or-nothing step:
  either the whole new file goes in, or nothing changes. Other sections
  and subjects are never touched. Within one subject a student belongs to
  one section, but different subjects can be in different sections.

**Table `admins`** has one row containing the admin's account ID. RLS
is ON. A signed-in user may only check whether their own ID is in it.
Nobody may insert, change or delete rows through the website. The row is
added by hand in the Supabase dashboard.

**Supabase settings:** public sign-ups are turned OFF. The admin account
is created by hand in the Supabase dashboard.

## Login
- **Students:** no accounts. Student number + code is their access, and
  it's checked by the lookup function.
- **Admin:** Supabase Auth with email and password, one account only,
  sign-ups disabled.

## Done for the demo
On the LIVE Vercel URL:
- [ ] The admin logs in, and a wrong password is rejected.
- [ ] The admin uploads the BSIT2-9 · ITE300 CSV, sees "55 students found
      for BSIT2-9 · ITE300", and replaces its records.
- [ ] A BSIT1-6 student enters ONE code, picks ITE260 and sees it, then
      uses Check another subject to see ITE366.
- [ ] A student with retakes enters their number and code and sees the
      correct wrap-ups, check-ins and min. scores.
- [ ] A student with nothing to retake sees "You're all clear".
- [ ] A wrong code shows "No match" and reveals nothing.
- [ ] Logged out, the records table can't be read through the public key
      (checked during `/code-review`).
- [ ] Supabase shows RLS enabled on every table, and sign-ups are off.
- [ ] No real student data is in the GitHub repo.

## Out of scope
- Live sync with Google Sheets
- Editing student records inside the app
- More than one admin account
- P1 / P3 data or a history of past periods
- Sending codes by email from the app
- Printing code slips from the app
- Showing grades or mastery grades to students (remarks ARE shown since
  Ticket 10)
- Locking a student number after repeated wrong codes
- Search on the admin records table
