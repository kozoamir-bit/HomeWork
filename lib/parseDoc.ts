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
  reminder: string | null;
};


/** Returns a Date object in Israel local time */
function israelNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" })
  );
}

/** e.g. "27.5" for May 27 */
function todayPattern(d: Date): string {
  return `${d.getDate()}.${d.getMonth() + 1}`;
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
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/[ \t]+/g, " ")
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

  const pattern = todayPattern(today);

  // ── Find column index by matching today's date in the header row ──────────
  const headerRow = rows[0];
  let colIndex = -1;
  for (let i = 0; i < headerRow.length; i++) {
    if (headerRow[i].includes(pattern)) {
      colIndex = i;
      break;
    }
  }
  if (colIndex === -1) return null; // Doc not yet updated for this week

  const dateLabel = headerRow[colIndex].replace(/\s+/g, " ").trim();

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

  // Reminder – search only within table rows for a "שימו לב" label
  let reminder: string | null = null;
  for (const row of rows) {
    const label = row[0]?.trim() ?? "";
    if (label.includes("שימו לב") || label.includes("הערה")) {
      const content = row[colIndex]?.trim();
      if (content) reminder = content;
      break;
    }
  }

  return {
    dateLabel,
    learned,
    homework,
    reminder,
  };
}
