"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { readUpload, type StudentRecord } from "@/lib/upload-csv";

export function UploadCard() {
  const router = useRouter();
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [fileChosen, setFileChosen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    setMessage("");
    const file = event.target.files?.[0];
    if (!file) return;

    // The file is read here in the browser. Nothing is saved until the
    // Replace button is clicked.
    const result = readUpload(await file.text());
    setRecords(result.records);
    setProblems(result.problems);
    setFileChosen(true);
  }

  async function handleReplace() {
    setSaving(true);
    setMessage("");

    // One call, one all-or-nothing step in the database. RLS and the
    // is_admin() check inside the function stop anyone but an admin.
    const { data, error } = await createClient().rpc(
      "replace_student_records",
      { p_records: records },
    );

    setSaving(false);
    if (error) {
      setMessage(`Nothing was changed: ${error.message}`);
      return;
    }
    setMessage(`✅ Replaced all records with ${data} students.`);
    setRecords([]);
    setProblems([]);
    setFileChosen(false);
    router.refresh(); // reload the records table below
  }

  const sections = [...new Set(records.map((r) => r.section))].filter(Boolean);
  const canReplace = fileChosen && records.length > 0 && problems.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CSV</CardTitle>
        <p className="text-sm text-muted-foreground">
          In Google Sheets, open the Upload tab, then File → Download →
          Comma-separated values (.csv). Uploading replaces ALL current
          records.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="csv-file">Upload tab CSV</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            // Clear the value so choosing the same file again re-reads it.
            onClick={(e) => (e.currentTarget.value = "")}
          />
        </div>

        {fileChosen && (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              <strong>{records.length} students found</strong>
              {sections.length > 0 && ` in ${sections.join(", ")}`},{" "}
              <strong>
                {problems.length} problem{problems.length === 1 ? "" : "s"}
              </strong>
              .
            </p>
            {problems.length > 0 && (
              <ul className="list-disc pl-5 text-destructive">
                {problems.slice(0, 10).map((p) => (
                  <li key={p}>{p}</li>
                ))}
                {problems.length > 10 && (
                  <li>…and {problems.length - 10} more. Fix them in the sheet and upload again.</li>
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

        <Button onClick={handleReplace} disabled={!canReplace || saving}>
          {saving ? "Replacing…" : "Replace all records"}
        </Button>
      </CardContent>
    </Card>
  );
}
