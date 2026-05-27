import { NextResponse } from "next/server";

const DOC_URL =
  "https://docs.google.com/document/u/0/d/1-BKxYj06sTwS69O9nmZQXIV9q5TEem6-So4gRzvKiU8/mobilebasic";

function parseTable(html: string): string[][] {
  const rows: string[][] = [];
  const rowMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  for (const row of rowMatches) {
    const cells: string[] = [];
    const cellMatches = row.match(/<td[\s\S]*?<\/td>/gi) ?? [];
    for (const cell of cellMatches) {
      const text = cell
        .replace(/<br\s*\/?>/gi, "↵")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/[ \t]+/g, " ")
        .trim();
      cells.push(text);
    }
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

export async function GET() {
  const res = await fetch(DOC_URL, { cache: "no-store" });
  const html = await res.text();
  const rows = parseTable(html);

  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));

  return NextResponse.json({
    israelTime: now.toISOString(),
    dayOfWeek: now.getDay(),
    datePattern: `${now.getDate()}.${now.getMonth() + 1}`,
    totalRows: rows.length,
    headerRow: rows[0],
    rows: rows.slice(0, 12),
  });
}
