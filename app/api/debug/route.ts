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
        .replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/ /g, " ")
        .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&#34;/g, '"')
        .replace(/&amp;/g, "&").replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim();
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
  const debug = rows.map((cells, i) => ({
    rowIndex: i,
    col0: JSON.stringify(cells[0] ?? ""),
    col0hex: [...(cells[0] ?? "")].slice(0, 30).map(c => c.codePointAt(0)?.toString(16)).join(" "),
    numCells: cells.length,
  }));
  return NextResponse.json(debug);
}
