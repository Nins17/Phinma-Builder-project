# 10 — Remarks

**What to build:** The teacher adds a Remarks column to the CSV, e.g.
"Retake the P1 check-in; score at least 70." Each student sees their own
remark for the subject they are viewing.

**Blocked by:** 09

**Status:** todo

- [x] The CSV template has a Remarks column
- [x] Older CSVs without a Remarks column still upload (remarks blank)
- [x] The student result shows the remark for that subject, including
      for students who are all clear. No remark means no Remarks box.
- [x] The admin table shows a Remarks column
- [x] Remarks are only returned by the lookup (number AND code must
      match). The public still can't read the table.
- [ ] Works on the live URL
