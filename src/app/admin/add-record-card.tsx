"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  groupKey,
  normalizeSection,
  normalizeSubject,
  readUpload,
  type StudentRecord,
} from "@/lib/upload-csv";

// groupCounts: how many records each section + subject has now, keyed
// by groupKey(), e.g. { "BSIT2-9|ITE300": 55 }, so the preview can say
// what will be replaced.
// fixed: set inside a section + subject's table to make this its
// "Replace all records" button, with both filled in and locked.
export function AddRecordCard({
  groupCounts,
  fixed,
}: {
  groupCounts: Record<string, number>;
  fixed?: { section: string; subject: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState(fixed?.section ?? "");
  const [subject, setSubject] = useState(fixed?.subject ?? "");
  const [fileText, setFileText] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Re-check the file whenever the section, subject or file changes, so
  // a typo shows up straight away.
  const typedSection = normalizeSection(section);
  const typedSubject = normalizeSubject(subject);
  const label = `${typedSection} · ${typedSubject}`;
  const { records, problems } =
    fileText === null
      ? { records: [] as StudentRecord[], problems: [] as string[] }
      : readUpload(fileText, typedSection, typedSubject);
  const allProblems = [
    ...(fileText !== null && !typedSection ? ["Type the section first."] : []),
    ...(fileText !== null && !typedSubject ? ["Type the subject first."] : []),
    ...problems,
  ];
  const currentCount = groupCounts[groupKey(typedSection, typedSubject)] ?? 0;
  const canSave = fileText !== null && records.length > 0 && allProblems.length === 0;

  function reset() {
    setSection(fixed?.section ?? "");
    setSubject(fixed?.subject ?? "");
    setFileText(null);
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    setMessage("");
    const file = event.target.files?.[0];
    // The file is read here in the browser. Nothing is saved until the
    // Save button is clicked.
    setFileText(file ? await file.text() : null);
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    // One call, one all-or-nothing step in the database. Only this
    // section + subject's records are replaced, and only an admin may.
    const { data, error } = await createClient().rpc("replace_section_records", {
      p_section: typedSection,
      p_subject: typedSubject,
      p_records: records,
    });

    setSaving(false);
    if (error) {
      setMessage(`Nothing was changed: ${error.message}`);
      return;
    }
    setMessage(`✅ Saved ${data} students in ${label}.`);
    reset();
    setOpen(false);
    router.refresh(); // reload the section tables below
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          className="w-fit"
          variant={fixed ? "outline" : "default"}
          size={fixed ? "sm" : "default"}
          onClick={() => {
            setMessage(""); // don't show the last "Saved" inside a new upload
            setOpen(true);
          }}
        >
          {fixed ? "Replace all records" : "Add record"}
        </Button>
        {message && (
          <p className="text-sm" role="status">
            {message}
          </p>
        )}
      </div>
    );
  }

  const idSuffix = fixed ? groupKey(fixed.section, fixed.subject) : "new";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {fixed ? `Replace all ${label} records` : "Add record"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {fixed
            ? `Choose the updated ${label} CSV`
            : "Type the section and subject, then choose their CSV"}{" "}
          (in Google Sheets: File → Download → Comma-separated values). If
          this section + subject already has records, they are replaced.
          Nothing else is touched. Each student must use the same code in
          every subject.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!fixed && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. BSIT1-6"
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. ITE260"
                autoComplete="off"
              />
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor={`csv-file-${idSuffix}`}>CSV file</Label>
          <Input
            id={`csv-file-${idSuffix}`}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            // Clear the value so choosing the same file again re-reads it.
            onClick={(e) => (e.currentTarget.value = "")}
          />
        </div>

        {fileText !== null && (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              <strong>{records.length} students found</strong>
              {typedSection && typedSubject && ` for ${label}`},{" "}
              <strong>
                {allProblems.length} problem{allProblems.length === 1 ? "" : "s"}
              </strong>
              .
            </p>
            {typedSection && typedSubject && (
              <p className="text-muted-foreground">
                {currentCount > 0
                  ? `This will replace the ${currentCount} current ${label} records.`
                  : `${label} is new.`}
              </p>
            )}
            {allProblems.length > 0 && (
              <ul className="list-disc pl-5 text-destructive">
                {allProblems.slice(0, 10).map((p) => (
                  <li key={p}>{p}</li>
                ))}
                {allProblems.length > 10 && (
                  <li>
                    …and {allProblems.length - 10} more. Fix them in the sheet
                    and upload again.
                  </li>
                )}
              </ul>
            )}
          </div>
        )}

        {message && (
          <p className="text-sm" role="status">
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSave} disabled={!canSave || saving}>
            {saving ? "Saving…" : fixed ? "Replace all records" : "Save"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              reset();
              setMessage("");
            }}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
