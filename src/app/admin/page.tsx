import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Not logged in -> off to the login page.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // Logged in is not enough: the account must also be in the admins
  // table. RLS only lets a user see their own row, so this finds a row
  // only if this user is an admin.
  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.email}
          </p>
        </div>
        <LogoutButton />
      </header>

      {adminRow ? (
        <RecordsCard />
      ) : (
        <p className="text-sm text-destructive" role="alert">
          This account is not an admin.
        </p>
      )}
    </main>
  );
}

// Every student record, codes included. Only admins get rows back:
// the RLS policy in 004 checks is_admin() on every read.
async function RecordsCard() {
  const supabase = await createClient();
  const { data: records, error } = await supabase
    .from("student_records")
    .select(
      "student_number, student_name, section, code, wrapup_quizzes, wrapup_min_score, checkin_tests, checkin_min_score, uploaded_at",
    )
    .order("section")
    .order("student_name");

  const lastUpload = records?.reduce<string | null>(
    (latest, r) => (!latest || r.uploaded_at > latest ? r.uploaded_at : latest),
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student records ({records?.length ?? 0})</CardTitle>
        <p className="text-sm text-muted-foreground">
          Last uploaded:{" "}
          {lastUpload
            ? new Date(lastUpload).toLocaleString("en-PH", {
                timeZone: "Asia/Manila",
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "never"}
        </p>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">
            Could not load records: {error.message}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  {[
                    "Student Number",
                    "Name",
                    "Section",
                    "Code",
                    "Wrap-Ups",
                    "Min.",
                    "Check-ins",
                    "Min.",
                  ].map((heading, i) => (
                    <th key={i} className="whitespace-nowrap px-2 py-2 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records?.map((r) => (
                  <tr key={r.student_number} className="border-b border-border">
                    <td className="whitespace-nowrap px-2 py-2">{r.student_number}</td>
                    <td className="whitespace-nowrap px-2 py-2">{r.student_name}</td>
                    <td className="whitespace-nowrap px-2 py-2">{r.section}</td>
                    <td className="px-2 py-2 font-mono">{r.code}</td>
                    <td className="px-2 py-2">{r.wrapup_quizzes || "—"}</td>
                    <td className="whitespace-nowrap px-2 py-2">{r.wrapup_min_score || "—"}</td>
                    <td className="px-2 py-2">{r.checkin_tests || "—"}</td>
                    <td className="whitespace-nowrap px-2 py-2">{r.checkin_min_score || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
