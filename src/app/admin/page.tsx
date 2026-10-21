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
        <Card>
          <CardHeader>
            <CardTitle>Student records</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The records table and CSV upload come next (Tickets 05 and 06).
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-destructive" role="alert">
          This account is not an admin.
        </p>
      )}
    </main>
  );
}
