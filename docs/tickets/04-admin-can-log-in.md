# 04 — Admin can log in

**What to build:** The teacher can log in with email and password and
reach a private dashboard. Nobody else can get an account or reach the
dashboard.

**Blocked by:** 02

**Status:** todo

- [ ] Public sign-ups are turned OFF in Supabase
- [ ] The teacher's admin account is created by hand in the Supabase
      dashboard
- [ ] The `admins` table exists with RLS ON. A signed-in user can only
      check their own row, and nobody can add rows through the website.
- [ ] The teacher's account ID is added to `admins`
- [ ] The admin login page accepts the right email and password and
      rejects a wrong one
- [ ] Visiting the dashboard while logged out sends you to the login page
- [ ] A Log out button works
- [ ] Works on the live URL
