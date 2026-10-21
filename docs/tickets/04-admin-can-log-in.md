# 04 — Admin can log in

**What to build:** The teacher can log in with email and password and
reach a private dashboard. Nobody else can get an account or reach the
dashboard.

**Blocked by:** 02

**Status:** done

- [x] Public sign-ups are turned OFF in Supabase
- [x] The teacher's admin account is created by hand in the Supabase
      dashboard
- [x] The `admins` table exists with RLS ON. A signed-in user can only
      check their own row, and nobody can add rows through the website.
- [x] The teacher's account ID is added to `admins`
- [x] The admin login page accepts the right email and password and
      rejects a wrong one
- [x] Visiting the dashboard while logged out sends you to the login page
- [x] A Log out button works
- [x] Works on the live URL
