// Reads the Upload tab CSV (File -> Download -> CSV in Google Sheets)
// and checks it before anything is saved.

export type StudentRecord = {
  student_number: string;
  student_name: string;
  section: string;
  code: string;
  wrapup_quizzes: string;
  wrapup_min_score: string;
  checkin_tests: string;
  checkin_min_score: string;
};

// Upload tab column name -> database column name.
const COLUMNS: Record<string, keyof StudentRecord> = {
  "student number": "student_number",
  "student name": "student_name",
  section: "section",
  code: "code",
  "wrap-up quizzes to retake": "wrapup_quizzes",
  "min. score per quiz": "wrapup_min_score",
  "check-in to retake": "checkin_tests",
  "min. check-in score": "checkin_min_score",
};

const REQUIRED: (keyof StudentRecord)[] = [
  "student_number",
  "student_name",
  "section",
  "code",
];

// Splits CSV text into rows of cells. Handles quoted cells, so a name
// like "DELA CRUZ, JUAN" stays one cell even though it has a comma.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'; // "" inside quotes is a literal quote
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// A dash in the sheet means "nothing to retake".
function clean(value: string | undefined) {
  const v = (value ?? "").trim();
  return v === "—" || v === "–" || v === "-" ? "" : v;
}

export function readUpload(text: string): {
  records: StudentRecord[];
  problems: string[];
} {
  const rows = parseCsv(text.replace(/^﻿/, "")); // drop Excel's BOM
  const problems: string[] = [];
  if (rows.length === 0) return { records: [], problems: ["The file is empty."] };

  // Find each column by its heading, in whatever order they appear.
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const index: Partial<Record<keyof StudentRecord, number>> = {};
  header.forEach((h, i) => {
    if (COLUMNS[h]) index[COLUMNS[h]] = i;
  });
  const missing = Object.entries(COLUMNS)
    .filter(([, key]) => index[key] === undefined)
    .map(([heading]) => heading);
  if (missing.length > 0) {
    return {
      records: [],
      problems: [
        `Missing columns: ${missing.join(", ")}. Is this the Upload tab?`,
      ],
    };
  }

  const records: StudentRecord[] = [];
  const seen = new Map<string, number>();

  rows.slice(1).forEach((cells, i) => {
    const line = i + 2; // spreadsheet row number (row 1 is the heading)
    if (cells.every((c) => c.trim() === "")) return; // skip blank rows

    const record = {} as StudentRecord;
    for (const key of Object.values(COLUMNS)) {
      record[key] = clean(cells[index[key]!]);
    }

    for (const key of REQUIRED) {
      if (!record[key]) problems.push(`Row ${line}: missing ${key.replace("_", " ")}.`);
    }
    if (record.student_number) {
      const firstRow = seen.get(record.student_number);
      if (firstRow) {
        problems.push(
          `Row ${line}: student number ${record.student_number} is already used on row ${firstRow}.`,
        );
      } else {
        seen.set(record.student_number, line);
      }
    }
    records.push(record);
  });

  if (records.length === 0) problems.push("No students found in the file.");
  return { records, problems };
}
