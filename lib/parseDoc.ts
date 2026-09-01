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

const HOMEWORK_LABELS = ["שיעורי בית", "שעורי בית", "תרגול מקדם", "תרגול"];

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

function isHomeworkLabel(label: string): boolean {
  return HOMEWORK_LABELS.some((l) => label.includes(l));
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
  if (rows.length < 5) return null;

  const today = israelNow();
  const dayOfWeek = today.getDay();
  if (dayOfWeek === 6) return null;

  const headerRow = rows[0];
  const todayName = HE_DAYS[dayOfWeek];
  const colIndex = findColByDayName(headerRow, todayName);
  if (colIndex === -1) return null;

  // Tomorrow: skip to Sunday only if doc typically has it (Friday → -1)
  const tomorrowDow = dayOfWeek === 5 ? 0 : dayOfWeek + 1;
  const tomorrowCol = tomorrowDow === 0
    ? -1
    : findColByDayName(headerRow, HE_DAYS[tomorrowDow]);

  const dateLabel = `${todayName} ${today.getDate()}.${today.getMonth() + 1}`;

  const cellAt = (rowIdx: number, col: number): string =>
    rows[rowIdx]?.[col]?.trim() ?? "";

  // ── Classify rows dynamically ─────────────────────────────────────────────
  // Skip row 0 (header) and row 1 (morning reading)
  // Split on: empty label row OR row whose label is a homework section header
  let inHomework = false;
  const learnedRows: number[] = [];
  const homeworkRows: number[] = [];

  for (let i = 2; i < rows.length; i++) {
    const label = rows[i]?.[0]?.trim() ?? "";
    if (!label) { inHomework = true; continue; }
    if (isHomeworkLabel(label)) { inHomework = true; }
    if (inHomework) {
      if (!isHomeworkLabel(label)) homeworkRows.push(i);
    } else {
      learnedRows.push(i);
    }
  }

  const learned: SubjectEntry[] = learnedRows
    .map((r) => ({ subject: rows[r][0].trim(), content: cellAt(r, colIndex) }))
    .filter((e) => e.content);

  const homework: SubjectEntry[] = homeworkRows
    .map((r) => ({ subject: rows[r][0].trim(), content: cellAt(r, colIndex) }))
    .filter((e) => e.content);

  // Tomorrow: deduplicate by subject name, skip homework-label rows
  const tomorrow: SubjectEntry[] = [];
  const seenTomorrow = new Set<string>();
  for (const r of learnedRows) {
    const subject = rows[r][0].trim();
    if (!subject || isHomeworkLabel(subject) || seenTomorrow.has(subject)) continue;
    seenTomorrow.add(subject);
    tomorrow.push({ subject, content: tomorrowCol > 0 ? cellAt(r, tomorrowCol) : "" });
  }

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
