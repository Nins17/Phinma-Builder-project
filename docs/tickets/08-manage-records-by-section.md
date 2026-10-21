# 08 — Manage records by section

**What to build:** The teacher manages each section separately. They
add or replace one section's records by typing the section and uploading
its CSV, see one table per section, remove a whole section, and download
a blank CSV template. However many sections they teach, each one is
handled on its own.

**Blocked by:** 06

**Status:** todo

- [ ] An Add record button asks for the section and a CSV file
- [ ] The preview shows the student count, any problems, and how many
      current records of that section will be replaced
- [ ] Saving replaces ONLY that section's records in one all-or-nothing
      step. Other sections are unchanged.
- [ ] A student number that already belongs to another section is
      rejected with a clear message
- [ ] A Download CSV template button gives a CSV with the right headings
- [ ] The dashboard shows one table per section (sorted), each with its
      student count and last-upload time
- [ ] A Remove section button deletes that section's records after a
      confirmation. Other sections are unchanged.
- [x] Only admins can add, replace or remove sections (checked in the
      database)
- [x] Rows containing only dashes are ignored, not counted as students
- [ ] Works on the live URL
