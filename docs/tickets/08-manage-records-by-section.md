# 08 — Manage records by section

**What to build:** The teacher manages each section separately. They
add or replace one section's records by typing the section and uploading
its CSV, see a clickable list of sections, remove a whole section, and
download a blank CSV template. However many sections they teach, each
one is handled on its own.

**Blocked by:** 06

**Status:** done

- [x] An Add record button asks for the section and a CSV file
- [x] The preview shows the student count, any problems, and how many
      current records of that section will be replaced
- [x] Saving replaces ONLY that section's records in one all-or-nothing
      step. Other sections are unchanged.
- [x] A student number that already belongs to another section (for
      the same subject, since Ticket 09) is rejected with a clear message
- [x] A Download CSV template button gives a CSV with the right headings
- [x] The dashboard lists sections (sorted). Clicking one opens its
      records table, student count and last-upload time.
- [x] Each section has its own Replace all records button, with the
      section filled in and locked
- [x] A note explains that records are changed by editing the CSV and
      re-uploading it
- [x] A Remove section button deletes that section's records after a
      confirmation, and says how many were removed. Other sections are
      unchanged.
- [x] Only admins can add, replace or remove sections (checked in the
      database)
- [x] Rows containing only dashes are ignored, not counted as students
- [x] The student's Code box hides the code, with a Show/Hide button
- [x] Works on the live URL
