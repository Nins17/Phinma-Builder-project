# 06 — Admin uploads the CSV

**What to build:** The teacher downloads the Upload tab as a CSV, uploads
it on the dashboard, checks a preview, and replaces all records in one
step.

**Blocked by:** 05

**Status:** todo

- [x] The dashboard has an Upload CSV picker that reads the Upload tab's
      columns (student names containing commas work)
- [x] Before saving, a preview shows how many students were found and
      lists any problems (e.g. missing student number or code, or a
      duplicate student number)
- [ ] The Replace all records button swaps old records for new ones as
      one all-or-nothing step
- [ ] A file with problems can't be saved, and the old records stay
      unchanged
- [ ] Only admins can replace records (checked by RLS, not just by
      hiding the button)
- [ ] The records table and "last uploaded" time update after replacing
- [ ] Works on the live URL
