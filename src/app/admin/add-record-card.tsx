"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  normalizeSection,
  readUpload,
  type StudentRecord,
} from "@/lib/upload-csv";

// sectionCounts: how many records each section has now, e.g.
// { "BSIT2-9": 55 }, so the preview can say what will be replaced.
export function AddRecordCard({
  sectionCounts,
}: {
  sectionCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState("");
  const [fileText, setFileText] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Re-check the file whenever the section or the file changes, so a
  // typo in the section shows up straight away.
  const typedSection = normalizeSection(section);
  const { records, problems } =
    fileText === null
      ? { records: [] as StudentRecord[], problems: [] as string[] }
      : readUpload(fileText, typedSection);
  const allProblems = [
    ...(fileText !== null && !typedSection ? ["Type the section first."] : []),
    ...problems,
  ];
  const currentCount = sectionCounts[typedSection] ?? 0;
  const canSave = fileText !== null && records.length > 0 && allProblems.length === 0;

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
    // section's records are replaced, and only an admin may do it.
    const { data, error } = await createClient().rpc("replace_section_records", {
      p_section: typedSection,
      p_records: records,
    });

    setSaving(false);
    if (error) {
      setMessage(`Nothing was changed: ${error.message}`);
      return;
    }
    setMessage(`✅ Saved ${data} students in ${typedSection}.`);
    setSection("");
    setFileText(null);
    setOpen(false);
    router.refresh(); // reload the section tables below
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <Button className="w-fit" onClick={() => setOpen(true)}>
          Add record
        </Button>
        {message && (
          <p className="text-sm" role="status">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add record</CardTitle>
        <p className="text-sm text-muted-foreground">
          Type the section, then choose that section&apos;s CSV (in Google
          Sheets: File → Download → Comma-separated values). If the section
          already has records, they are replaced. Other sections are not
          touched.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="section">Section</Label>
          <Input
            id="section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="e.g. BSIT2-9"
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="csv-file">CSV file</Label>
          <Input
            id="csv-file"
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
              {typedSection && ` for ${typedSection}`},{" "}
              <strong>
                {allProblems.length} problem{allProblems.length === 1 ? "" : "s"}
              </strong>
              .
            </p>
            {typedSection && (
              <p className="text-muted-foreground">
                {currentCount > 0
                  ? `This will replace the ${currentCount} current ${typedSection} records.`
                  : `${typedSection} is a new section.`}
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
            {saving ? "Saving…" : "Save section"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setFileText(null);
              setSection("");
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
