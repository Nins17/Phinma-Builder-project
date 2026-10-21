// Reads one section's Upload tab CSV (File -> Download -> CSV in Google
// Sheets) and checks it before anything is saved.

export type StudentRecord = {
  student_number: string;
  student_name: string;
  code: string;
  wrapup_quizzes: string;
  wrapup_min_score: string;
  checkin_tests: string;
  checkin_min_score: string;
};

// Upload tab heading -> database column. These are also the headings in
// the downloadable template, in this order.
const COLUMNS: Record<string, keyof StudentRecord> = {
  "Student Number": "student_number",
  "Student Name": "student_name",
  Code: "code",
  "Wrap-Up Quizzes to Retake": "wrapup_quizzes",
  "Min. Score per Quiz": "wrapup_min_score",
  "Check-in to Retake": "checkin_tests",
  "Min. Check-in Score": "checkin_min_score",
};

export const TEMPLATE_HEADINGS = Object.keys(COLUMNS);

const REQUIRED: (keyof StudentRecord)[] = [
  "student_number",
  "student_name",
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

// Sections and subjects are stored in capitals with no spaces, so
// "bsit 1-6" = "BSIT1-6" and "ITe 366" = "ITE366". These are exactly
// the characters the database's clean_label() removes (009 SQL),
// including the non-breaking space Google Sheets sometimes pastes.
const SPACES = /[ \t\n\r\f\v\u00a0]/g;

function cleanLabel(value: string) {
  return value.replace(SPACES, "").toUpperCase();
}

export const normalizeSection = cleanLabel;
export const normalizeSubject = cleanLabel;

// One key per section + subject, e.g. "BSIT1-6|ITE260", for counting.
export function groupKey(section: string, subject: string) {
  return `${normalizeSection(section)}|${normalizeSubject(subject)}`;
}

export function readUpload(
  text: string,
  section: string,
  subject: string,
): {
  records: StudentRecord[];
  problems: string[];
} {
  const rows = parseCsv(text.replace(/^﻿/, "")); // drop Excel's BOM
  const problems: string[] = [];
  if (rows.length === 0) return { records: [], problems: ["The file is empty."] };

  // Find each column by its heading, in whatever order they appear.
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const index: Partial<Record<keyof StudentRecord, number>> = {};
  for (const [heading, key] of Object.entries(COLUMNS)) {
    const i = header.indexOf(heading.toLowerCase());
    if (i !== -1) index[key] = i;
  }
  const missing = Object.entries(COLUMNS)
    .filter(([, key]) => index[key] === undefined)
    .map(([heading]) => heading);
  if (missing.length > 0) {
    return {
      records: [],
      problems: [
        `Missing columns: ${missing.join(", ")}. Use the CSV template headings.`,
      ],
    };
  }

  // Section and Subject columns are optional (the teacher types both).
  // If the file has them, they must agree, to catch uploading the wrong
  // file, e.g. the ITE366 CSV while ITE260 is typed.
  const sectionIndex = header.indexOf("section");
  const subjectIndex = header.indexOf("subject");
  const typedSection = normalizeSection(section);
  const typedSubject = normalizeSubject(subject);

  const records: StudentRecord[] = [];
  const seen = new Map<string, number>();

  rows.slice(1).forEach((cells, i) => {
    const line = i + 2; // spreadsheet row number (row 1 is the heading)
    if (cells.every((c) => clean(c) === "")) return; // skip blank or dash-only rows

    const record = {} as StudentRecord;
    for (const key of Object.values(COLUMNS)) {
      record[key] = clean(cells[index[key]!]);
    }

    for (const key of REQUIRED) {
      if (!record[key]) problems.push(`Row ${line}: missing ${key.replace("_", " ")}.`);
    }
    const fileSection = sectionIndex === -1 ? "" : clean(cells[sectionIndex]);
    if (fileSection && typedSection && normalizeSection(fileSection) !== typedSection) {
      problems.push(
        `Row ${line}: the file says section ${fileSection}, but you typed ${typedSection}.`,
      );
    }
    const fileSubject = subjectIndex === -1 ? "" : clean(cells[subjectIndex]);
    if (fileSubject && typedSubject && normalizeSubject(fileSubject) !== typedSubject) {
      problems.push(
        `Row ${line}: the file says subject ${fileSubject}, but you typed ${typedSubject}.`,
      );
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
