"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

// What the lookup function returns. It never includes the code.
type Retakes = {
  student_name: string;
  section: string;
  wrapup_quizzes: string;
  wrapup_min_score: string;
  checkin_tests: string;
  checkin_min_score: string;
};

// "M1, M3" -> ["M1", "M3"]. A blank cell means nothing to retake.
function toList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function RetakeChecker() {
  const [studentNumber, setStudentNumber] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Retakes | null>(null);

  async function handleCheck(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    // Students can't read the table. They can only ask the lookup
    // function, which returns one row if the number AND code match.
    const supabase = createClient();
    const { data, error } = await supabase.rpc("lookup_student_record", {
      p_student_number: studentNumber.trim(),
      p_code: code.trim(),
    });

    setLoading(false);
    if (error) {
      setMessage("Something went wrong. Please try again in a moment.");
    } else if (!data || data.length === 0) {
      // Same message whether the number or the code was wrong, so nobody
      // can use this form to find out which student numbers exist.
      setMessage("No match. Check your student number and code.");
    } else {
      setResult(data[0]);
    }
  }

  function checkAnother() {
    setResult(null);
    setStudentNumber("");
    setCode("");
    setShowCode(false);
  }

  if (result) {
    const wrapups = toList(result.wrapup_quizzes);
    const checkins = toList(result.checkin_tests);
    const allClear = wrapups.length === 0 && checkins.length === 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle>{result.student_name}</CardTitle>
          <p className="text-sm text-muted-foreground">{result.section}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {allClear ? (
            <p className="text-lg font-medium">
              No retakes, you&apos;re all clear 🎉
            </p>
          ) : (
            <>
              <RetakeList
                title="Wrap-Up Quizzes to Retake"
                items={wrapups}
                minScore={result.wrapup_min_score}
              />
              <RetakeList
                title="Check-ins to Retake"
                items={checkins}
                minScore={result.checkin_min_score}
              />
            </>
          )}
          <p className="text-sm text-muted-foreground">
            P2 status is not final.
          </p>
          <Button variant="outline" onClick={checkAnother}>
            Check another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check my retakes</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCheck} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="student-number">Student Number</Label>
            <Input
              id="student-number"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="e.g. 00-0000-000000"
              autoComplete="off"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="code">Code</Label>
            <div className="flex gap-2">
              {/* type="password" shows dots, so classmates nearby can't
                  read the code over the student's shoulder. */}
              <Input
                id="code"
                type={showCode ? "text" : "password"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-character code from your teacher"
                autoComplete="off"
                autoCapitalize="characters"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCode(!showCode)}
                aria-pressed={showCode}
                aria-controls="code"
              >
                {showCode ? (
                  <EyeOff aria-hidden className="size-4" />
                ) : (
                  <Eye aria-hidden className="size-4" />
                )}
                {showCode ? "Hide" : "Show"}
              </Button>
            </div>
          </div>
          {message && (
            <p className="text-sm text-destructive" role="alert">
              {message}
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Checking…" : "Check"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RetakeList({
  title,
  items,
  minScore,
}: {
  title: string;
  items: string[];
  minScore: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2">
            {items.map((item) => (
              <li
                key={item}
                className="rounded-full border border-border px-3 py-1 text-sm"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm">
            Minimum score on each: <strong>{minScore}</strong>
          </p>
        </>
      )}
    </div>
  );
}
