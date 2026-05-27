/**
 * parseDoc.ts
 * Fetches the Google Doc weekly plan and extracts today's data.
 * No API keys needed – the doc is public (mobilebasic URL).
 * Cached by Next.js for 30 minutes to avoid hammering Google.
 */

const DOC_URL =
  "https://docs.google.com/document/u/0/d/1-BKxYj06sTwS69O9nmZQXIV9q5TEem6-So4gRzvKiU8/mobilebasic";

export type SubjectEntry = { subject: string; content: string };

export type DayData = {
  dateLabel: string;
  learned: SubjectEntry[];
  homework: SubjectEntry[];
  morningReading: string | null;
  reminder: string | null;
};

const HE_DAYS: Record<number, string> = {
  0: "יום ראשון",
  1: "יום שני",
  2: "יום שלישי",
  3: "יום רביעי",
  4: "יום חמישי",
  5: "יום שישי",
};

/** Returns a Date object in Israel local time */
function israelNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" })
  );
}

/** Minimal HTML table parser – no dependencies needed */
function parseTable(html: string): string[][] {
  const rows: string[][] = [];
  const rowMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];

  for (const row of rowMatches) {
    const cells: string[] = [];
    const cellMatches = row.match(/<td[\s\S]*?<\/td>/gi) ?? [];
    for (const cell of cellMatches) {
      // Strip tags, decode basic entities, normalise whitespace
      const text = cell
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/ /g, " ")
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/[ \t]+/g, " ")
        .replace(/\n /g, "\n")
        .replace(/ \n/g, "\n")
        .replace(/\n{2,}/g, "\n")
        .trim();
      cells.push(text);
    }
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

export async function fetchDayData(): Promise<DayData | null> {
  let html: string;
  try {
    const res = await fetch(DOC_URL, {
      next: { revalidate: 1800 }, // cache 30 min
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  const rows = parseTable(html);
  if (rows.length < 7) return null;

  const today = israelNow();
  const dayOfWeek = today.getDay(); // 0=Sun … 6=Sat
  if (dayOfWeek === 6) return null; // Shabbat

  const todayName = HE_DAYS[dayOfWeek];

  // ── Find column by Hebrew day name (dates in the doc may be wrong) ─────────
  const headerRow = rows[0];
  let colIndex = -1;
  for (let i = 0; i < headerRow.length; i++) {
    if (headerRow[i].includes(todayName)) {
      colIndex = i;
      break;
    }
  }
  if (colIndex === -1) return null;

  const dateLabel = `${todayName} ${today.getDate()}.${today.getMonth() + 1}`;

  // Helper: get cell text at today's column for a given row index
  const cell = (rowIdx: number): string =>
    rows[rowIdx]?.[colIndex]?.trim() ?? "";

  // Helper: get the subject label (first column) for a row
  const subject = (rowIdx: number): string =>
    rows[rowIdx]?.[0]?.trim() ?? "";

  // Table structure (row indices may shift if teacher adds rows – adjust here if needed):
  // Row 0: day headers
  // Row 1: morning reading reminder (label col = "קריאת בוקר")
  // Row 2: שפה  (learned)
  // Row 3: חשבון (learned)
  // Row 4: תורה  (learned)
  // Row 5: empty separator
  // Row 6: שפה  (homework)
  // Row 7: חשבון (homework)
  // Row 8: אחר  (homework)

  const learnedRows = [2, 3, 4];
  const homeworkRows = [6, 7, 8];

  const learned: SubjectEntry[] = learnedRows
    .map((r) => ({ subject: subject(r), content: cell(r) }))
    .filter((e) => e.content);

  const homework: SubjectEntry[] = homeworkRows
    .map((r) => ({ subject: subject(r), content: cell(r) }))
    .filter((e) => e.content);

  // Morning reading – merged cell, content is always in column 1
  let morningReading: string | null = null;
  let reminder: string | null = null;
  for (const row of rows) {
    const label = row[0]?.trim() ?? "";
    if (label.includes("קריאת בוקר")) {
      const content = (row[colIndex] || row[1])?.trim();
      if (content) morningReading = content;
    } else if (label.includes("שימו לב") || label.includes("הערה")) {
      const content = (row[colIndex] || row[1])?.trim();
      if (content) reminder = content;
    }
  }

  return {
    dateLabel,
    learned,
    homework,
    morningReading,
    reminder,
  };
}
