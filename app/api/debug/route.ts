import { NextResponse } from "next/server";

const DOCS: Record<string, string> = {
  homework: "https://docs.google.com/document/u/0/d/1-BKxYj06sTwS69O9nmZQXIV9q5TEem6-So4gRzvKiU8/mobilebasic",
  schedule: "https://docs.google.com/document/u/0/d/1K91Xi_QZXfY0ZJeAVpLR1Cd9NX-fLWrxrReVWzndl8M/mobilebasic",
};

function parseTable(html: string): string[][] {
  const rows: string[][] = [];
  const rowMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  for (const row of rowMatches) {
    const cells: string[] = [];
    const cellMatches = row.match(/<td[\s\S]*?<\/td>/gi) ?? [];
    for (const cell of cellMatches) {
      const text = cell
        .replace(/<\/p>/gi, "↵")
        .replace(/<\/div>/gi, "↵")
        .replace(/<br\s*\/?>/gi, "↵")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/ /g, " ")
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/[ \t]+/g, " ")
        .replace(/↵+/g, "↵")
        .trim();
      cells.push(text);
    }
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doc = searchParams.get("doc") ?? "homework";
  const url = DOCS[doc] ?? DOCS.homework;

  const res = await fetch(url, { cache: "no-store" });
  const html = await res.text();
  const rows = parseTable(html);

  // Find body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;

  // Strip script and style blocks first, then extract text
  const cleaned = bodyHtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  const rawText = cleaned
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, " | ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/ /g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 6000);

  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));

  return NextResponse.json({
    doc,
    israelTime: now.toISOString(),
    dayOfWeek: now.getDay(),
    totalRows: rows.length,
    rows,
    rawText,
  });
}
