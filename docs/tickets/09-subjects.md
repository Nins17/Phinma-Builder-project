# 09 — Subjects

**What to build:** A section can have more than one subject (e.g. BSIT1-6
takes ITE260 and ITE366). Each student has ONE code for all their
subjects. After entering their student number and code, a student
chooses which of their subjects to check. The teacher uploads and
manages records per section + subject.

**Blocked by:** 08

**Status:** todo

- [x] Every record has a subject. Existing BSIT2-9 records become ITE300.
- [x] The same student number can have one record per subject
- [x] Add record asks for Section and Subject, then the CSV
- [x] The dashboard lists each section + subject with its count, last
      upload, Replace all records and Remove buttons
- [x] Replace and Remove only affect that section + subject
- [x] Uploading a subject where a student's code differs from their code
      in another subject is refused with a clear message (one code per
      student)
- [x] A student with several subjects chooses one from a list of only
      their subjects. A student with one subject sees it straight away.
- [x] The result shows the subject name, with Check another subject and
      Check another buttons
- [ ] Works on the live URL
