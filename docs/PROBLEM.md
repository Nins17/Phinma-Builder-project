# ITE300 Retake Checker

## Who
Students in the ITE300 sections (about 200 students across 4 sections,
roughly 50 each) who need to know which P2 wrap-up quizzes and check-in
tests they must retake. The teacher is the only admin and keeps the data
up to date.

## The struggle
When P2 results are released, students don't know what they need to
retake, so each one sends the teacher a private message to ask. Those
messages flood the teacher's inbox, and each one is answered by hand
from the Google Sheet.

## Today's workaround
The teacher keeps a P2 retake report in Google Sheets, with one file
per section and students grouped into Passed / Group A / Group B /
Group C / No Show. The teacher answers students' private messages one
at a time from that sheet. Sharing the sheet itself isn't an option,
because it would show every student's grades to the whole class and
damage students' trust in the teacher and the teacher's credibility.

- Cost: dozens of private messages for every release. The exact "before"
  count still needs measuring (count messages after the next release).

## The MVP
A student enters their student number and secret code and sees only
their own P2 wrap-up quizzes and check-in tests to retake, with the
minimum score required for each.

How it works:
1. The teacher keeps a plain **Upload** tab in the Google Sheet with
   these columns: `Student Number, Student Name, Section, Code,
   Wrap-Up Quizzes to Retake, Min. Score per Quiz, Check-in to Retake,
   Min. Check-in Score`.
2. The teacher logs in as the only admin (email and password) and
   uploads that tab as a CSV. Each upload replaces all the old data.
3. The teacher hands out codes outside the app, on printed slips or by
   email.
4. The student sees their name, section, wrap-up quizzes to retake (with
   min. score) and check-ins to retake (with min. score). A student with
   nothing to retake sees "No retakes, you're all clear 🎉".

Must never:
- Show a student any record except their own, or let anyone list all
  students.
- Show students grades, mastery grades, current check-in scores or
  remarks.
- Let anyone other than the teacher upload data or see the full list.
- Commit real student data to the repo (`/src/data/` is git-ignored).

## How we'll know it worked
The demo shows:
1. The teacher logs in and uploads the BSIT2-9 CSV.
2. A student enters their student number and code and sees their
   retakes and min. scores.
3. A wrong code is rejected and reveals nothing.
4. A student who passed sees "You're all clear".

Tried before Session 3 by **BSIT2-9** (55 students). Success means far
fewer retake private messages from BSIT2-9 than the teacher gets after a
normal release.

## Out of scope
- Live sync with Google Sheets (the teacher uploads a CSV instead)
- Editing student records inside the app (the teacher edits the sheet
  and re-uploads)
- More than one admin account (e.g. co-teachers)
- P1 / P3 data or a history of past periods (P2 only)
- Sending codes by email from the app
- Showing grades, mastery grades or remarks to students

## Glossary
- **Student**: one of the ~200 ITE300 students. Can see only their own
  record.
- **Admin**: the teacher. The only account that can upload data.
- **Student number**: the student's existing ID, which contains a "-".
  It identifies the student but isn't secret.
- **Code**: a secret 6-character code stored in the Upload tab and handed
  out privately. Student number + code = access to one record.
- **Section**: a class group such as BSIT2-9. There are 4.
- **Period**: a grading period. The MVP covers P2 only.
- **Wrap-up quiz to retake**: a module quiz such as `M1, M3`, with a min.
  score like `6 / 7`.
- **Check-in to retake**: e.g. `P1 check-in`, with a min. score like
  `87 / 100`, or `Aim high` for students who can't reach 80 in P2.
- **Min. score**: the score the student must reach on that retake.
- **Upload**: downloading the Upload tab as a CSV and loading it into the
  app. It replaces all the old data.
