import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { groupKey } from "@/lib/upload-csv";
import { AddRecordCard } from "./add-record-card";
import { LogoutButton } from "./logout-button";
import { RemoveSectionButton } from "./remove-section-button";
import { TemplateButton } from "./template-button";

type Row = {
  student_number: string;
  student_name: string;
  section: string;
  subject: string;
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
      "student_number, student_name, section, subject, code, wrapup_quizzes, wrapup_min_score, checkin_tests, checkin_min_score, uploaded_at",
    )
    .order("student_name");

  // Group the rows by section + subject:
  // { "BSIT1-6|ITE260": [...], "BSIT1-6|ITE366": [...] }
  const groups = new Map<string, Row[]>();
  for (const r of records ?? []) {
    const key = groupKey(r.section, r.subject);
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  // "numeric" sorts BSIT2-9 before BSIT2-10; "|" keeps the section first.
  const groupKeys = [...groups.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
  const groupCounts = Object.fromEntries(
    groupKeys.map((k) => [k, groups.get(k)!.length]),
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

      <AddRecordCard groupCounts={groupCounts} />

      {error && (
        <p className="text-sm text-destructive">
          Could not load records: {error.message}
        </p>
      )}

      {!error && groupKeys.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No sections yet. Click Add record to upload your first section.
        </p>
      )}

      {groupKeys.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            Sections and subjects
          </h2>
          <p className="rounded-[var(--radius)] border border-border bg-secondary px-4 py-3 text-sm">
            <strong>Need to change a record?</strong> Edit the CSV in Google
            Sheets, open the section and subject below, click{" "}
            <strong>Replace all records</strong> and upload the updated CSV.
            It replaces that section and subject&apos;s records only.
          </p>
          {groupKeys.map((key) => (
            <SectionCard
              key={key}
              rows={groups.get(key)!}
              groupCounts={groupCounts}
            />
          ))}
        </section>
      )}
    </main>
  );
}

// One section + subject. All its rows share the same section and subject.
function SectionCard({
  rows,
  groupCounts,
}: {
  rows: Row[];
  groupCounts: Record<string, number>;
}) {
  const { section, subject } = rows[0];
  const lastUpload = rows.reduce(
    (latest, r) => (r.uploaded_at > latest ? r.uploaded_at : latest),
    rows[0].uploaded_at,
  );

  // <details> is the browser's built-in open/close box: clicking the
  // <summary> line shows or hides the records. No extra code needed.
  return (
    <details className="group rounded-[var(--radius)] border border-border bg-card text-card-foreground shadow-sm">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 p-4 hover:bg-secondary">
        <span className="flex items-center gap-2">
          <span className="text-muted-foreground transition-transform group-open:rotate-90">
            ▶
          </span>
          <span className="text-lg font-semibold">
            {section} · {subject}
          </span>
          <span className="text-sm text-muted-foreground">
            {rows.length} students
          </span>
        </span>
        <span className="text-sm text-muted-foreground">
          Last uploaded:{" "}
          {new Date(lastUpload).toLocaleString("en-PH", {
            timeZone: "Asia/Manila",
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      </summary>
      <div className="flex flex-col gap-4 border-t border-border p-4">
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
        <AddRecordCard groupCounts={groupCounts} fixed={{ section, subject }} />
        <div>
          <RemoveSectionButton
            section={section}
            subject={subject}
            count={rows.length}
          />
        </div>
      </div>
    </details>
  );
}
