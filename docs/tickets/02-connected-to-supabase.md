# 02 — Connected to Supabase

**What to build:** The live site can ask the database "does this student
number + code match?" and get back only that student's retakes. Nobody
can read the whole student records table without logging in.

**Blocked by:** 01

**Status:** done

- [x] The Supabase URL and publishable (anon) key are set in
      `.env.local` AND in Vercel's environment variables
- [x] The `student_records` table exists with the columns in the spec,
      created from a numbered SQL file in the repo
- [x] Row Level Security is ON for `student_records`, with no policy
      that lets the public read it
- [x] A lookup function takes a student number and code and returns only
      name, section, wrap-ups, wrap-up min. score, check-ins and check-in
      min. score. It never returns the code, and returns nothing on a
      wrong match.
- [x] Two FAKE test students are added (one with retakes, one all
      clear). No real student data.
- [x] The example `notes` table SQL is removed from the repo
- [x] Works on the live URL: the site shows a fake student's lookup
      result
