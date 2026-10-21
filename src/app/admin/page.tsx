import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { AddRecordCard } from "./add-record-card";
import { LogoutButton } from "./logout-button";
import { RemoveSectionButton } from "./remove-section-button";
import { TemplateButton } from "./template-button";

type Row = {
  student_number: string;
  student_name: string;
  section: string;
  code: string;
  wrapup_quizzes: string;
  wrapup_min_score: string;
  checkin_tests: string;
  checkin_min_score: string;
  uploaded_at: string;
};

// One list drives both the table headings and the cells, so they can't
// drift apart when a column is added.
const TABLE_COLUMNS: { heading: string; key: keyof Row }[] = [
  { heading: "Student Number", key: "student_number" },
  { heading: "Name", key: "student_name" },
  { heading: "Code", key: "code" },
  { heading: "Wrap-Ups", key: "wrapup_quizzes" },
  { heading: "Min.", key: "wrapup_min_score" },
  { heading: "Check-ins", key: "checkin_tests" },
  { heading: "Min.", key: "checkin_min_score" },
];

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

  if (!adminRow) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-12">
        <p className="text-sm text-destructive" role="alert">
          This account is not an admin.
        </p>
        <LogoutButton />
      </main>
    );
  }

  // Every student record, codes included. Only admins get rows back:
  // the RLS policy in 004 checks is_admin() on every read.
  const { data: records, error } = await supabase
    .from("student_records")
    .select(
      "student_number, student_name, section, code, wrapup_quizzes, wrapup_min_score, checkin_tests, checkin_min_score, uploaded_at",
    )
    .order("student_name");

  // Group the rows by section: { "BSIT2-9": [...], "BSIT2-10": [...] }
  const sections = new Map<string, Row[]>();
  for (const r of records ?? []) {
    sections.set(r.section, [...(sections.get(r.section) ?? []), r]);
  }
  // "numeric" sorts BSIT2-9 before BSIT2-10.
  const sectionNames = [...sections.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
  const sectionCounts = Object.fromEntries(
    sectionNames.map((s) => [s, sections.get(s)!.length]),
  );

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
        <div className="flex flex-wrap gap-3">
          <TemplateButton />
          <LogoutButton />
        </div>
      </header>

      <AddRecordCard sectionCounts={sectionCounts} />

      {error && (
        <p className="text-sm text-destructive">
          Could not load records: {error.message}
        </p>
      )}

      {!error && sectionNames.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No sections yet. Click Add record to upload your first section.
        </p>
      )}

      {sectionNames.map((name) => (
        <SectionCard key={name} name={name} rows={sections.get(name)!} />
      ))}
    </main>
  );
}

function SectionCard({ name, rows }: { name: string; rows: Row[] }) {
  const lastUpload = rows.reduce(
    (latest, r) => (r.uploaded_at > latest ? r.uploaded_at : latest),
    rows[0].uploaded_at,
  );

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>
            {name} ({rows.length} students)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Last uploaded:{" "}
            {new Date(lastUpload).toLocaleString("en-PH", {
              timeZone: "Asia/Manila",
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <RemoveSectionButton section={name} count={rows.length} />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                {TABLE_COLUMNS.map((c, i) => (
                  <th key={i} className="whitespace-nowrap px-2 py-2 font-medium">
                    {c.heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.student_number} className="border-b border-border">
                  {TABLE_COLUMNS.map((c, i) => (
                    <td
                      key={i}
                      className={
                        c.key === "code"
                          ? "px-2 py-2 font-mono"
                          : "whitespace-nowrap px-2 py-2"
                      }
                    >
                      {r[c.key] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
