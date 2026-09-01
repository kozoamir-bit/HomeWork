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
  tomorrow: SubjectEntry[];
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

function israelNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" })
  );
}

function parseTable(html: string): string[][] {
  const rows: string[][] = [];
  const rowMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  for (const row of rowMatches) {
    const cells: string[] = [];
    const cellMatches = row.match(/<td[\s\S]*?<\/td>/gi) ?? [];
    for (const cell of cellMatches) {
      const text = cell
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/ /g, " ")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&#34;/g, '"')
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

function findColByDayName(headerRow: string[], dayName: string): number {
  for (let i = 0; i < headerRow.length; i++) {
    if (headerRow[i].includes(dayName)) return i;
  }
  return -1;
}

export async function fetchDayData(): Promise<DayData | null> {
  let html: string;
  try {
    const res = await fetch(DOC_URL, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  const rows = parseTable(html);
  if (rows.length < 7) return null;

  const today = israelNow();
  const dayOfWeek = today.getDay();
  if (dayOfWeek === 6) return null; // Shabbat

  const headerRow = rows[0];

  // Find today's column by Hebrew day name (doc dates may be wrong)
  const todayName = HE_DAYS[dayOfWeek];
  const colIndex = findColByDayName(headerRow, todayName);
  if (colIndex === -1) return null;

  // Find tomorrow's column (skip Shabbat)
  const tomorrowDow = dayOfWeek === 5 ? 0 : dayOfWeek + 1;
  const tomorrowName = HE_DAYS[tomorrowDow];
  const tomorrowCol = tomorrowDow === 0
    ? -1  // Sunday is next week – doc not yet updated
    : findColByDayName(headerRow, tomorrowName);

  const dateLabel = `${todayName} ${today.getDate()}.${today.getMonth() + 1}`;

  const cell = (rowIdx: number, col: number = colIndex): string =>
    rows[rowIdx]?.[col]?.trim() ?? "";

  const subject = (rowIdx: number): string =>
    rows[rowIdx]?.[0]?.trim() ?? "";

  // Row 0: headers | 1: קריאת בוקר | 2-4: learned | 5: separator | 6-8: homework
  const learnedRows = [2, 3, 4];
  const homeworkRows = [6, 7, 8];

  const learned: SubjectEntry[] = learnedRows
    .map((r) => ({ subject: subject(r), content: cell(r) }))
    .filter((e) => e.content);

  const homework: SubjectEntry[] = homeworkRows
    .map((r) => ({ subject: subject(r), content: cell(r) }))
    .filter((e) => e.content);

  const tomorrow: SubjectEntry[] =
    tomorrowCol > 0
      ? learnedRows
          .map((r) => ({ subject: subject(r), content: cell(r, tomorrowCol) }))
          .filter((e) => e.content)
      : [];

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

  return { dateLabel, learned, homework, tomorrow, morningReading, reminder };
}
