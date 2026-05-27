/**
 * app/page.tsx  – root page of the project
 * Server Component: fetches + parses the Google Doc on the server,
 * cached 30 min. Zero client JS, zero API keys.
 */

import { fetchDayData, type SubjectEntry } from "@/lib/parseDoc";
import s from "./page.module.css";

// Subject badge colours
const COLORS: Record<string, string> = {
  שפה: "#C94040",
  חשבון: "#2E6DC4",
  תורה: "#2F8A4C",
  אחר: "#7A4FC4",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,215,0.9)" strokeWidth="2" strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,215,0.9)" strokeWidth="2" strokeLinecap="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#C48800" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 50 50" width="22" height="22" style={{ display: "block", margin: "0 auto 4px" }}>
      <polygon points="25,4 29.5,17.5 44,17.5 32.5,26.5 37,40 25,31.5 13,40 17.5,26.5 6,17.5 20.5,17.5"
        fill="#FFD740" />
    </svg>
  );
}

function ContentLines({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} className={s.contentLine}>{line}</span>
      ))}
    </>
  );
}

function SubjectList({ items, emptyMsg }: { items: SubjectEntry[]; emptyMsg: string }) {
  if (items.length === 0) {
    return <p className={s.emptyItems}>{emptyMsg}</p>;
  }
  return (
    <>
      {items.map((item) => (
        <div key={item.subject} className={s.entry}>
          <span className={s.badge} style={{ background: COLORS[item.subject] ?? "#666" }}>
            {item.subject}
          </span>
          <p className={s.entryText}>
            <ContentLines text={item.content} />
          </p>
        </div>
      ))}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function Home() {
  const data = await fetchDayData();

  // Weekend / doc not updated yet
  if (!data) {
    return (
      <main className={s.page}>
        <div className={s.emptyDay}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
            stroke="#aaa" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p>
            אין נתונים להיום.<br />
            ייתכן שזה סוף שבוע או שהמסמך טרם עודכן.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={s.page}>

      {/* ── Decorative floaters ── */}

      {/* Pencil */}
      <svg className={`${s.floater} ${s.f1}`} width="52" height="52" viewBox="0 0 32 80">
        <rect x="8" y="4" width="16" height="54" rx="2" fill="#FFD740" />
        <polygon points="8,58 24,58 16,72" fill="#E8A800" />
        <circle cx="16" cy="72" r="2.5" fill="#444" />
        <rect x="8" y="4" width="16" height="9" rx="1" fill="#FFAAAA" />
        <rect x="8" y="13" width="16" height="2.5" fill="#999" />
      </svg>

      {/* Ruler */}
      <svg className={`${s.floater} ${s.f2}`} width="58" height="24" viewBox="0 0 100 28">
        <rect x="2" y="4" width="96" height="20" rx="3" fill="#A8D8EA" />
        <rect x="2" y="4" width="96" height="20" rx="3" fill="none" stroke="#6AAFC8" strokeWidth="1.5" />
        {[14, 26, 38, 50, 62, 74, 86].map((x, i) => (
          <line key={x} x1={x} y1="4" x2={x} y2={i % 2 === 0 ? 14 : 10}
            stroke="#6AAFC8" strokeWidth={i % 2 === 0 ? 1.5 : 1} />
        ))}
      </svg>

      {/* Pink star */}
      <svg className={`${s.floater} ${s.f3}`} width="30" height="30" viewBox="0 0 50 50">
        <polygon points="25,4 29.5,17.5 44,17.5 32.5,26.5 37,40 25,31.5 13,40 17.5,26.5 6,17.5 20.5,17.5"
          fill="#FF6BAC" />
      </svg>

      {/* Book */}
      <svg className={`${s.floater} ${s.f4}`} width="36" height="44" viewBox="0 0 50 60">
        <rect x="6" y="4" width="36" height="50" rx="3" fill="#7EC8E3" />
        <rect x="6" y="4" width="8" height="50" rx="2" fill="#5AAFC8" />
        <line x1="16" y1="18" x2="38" y2="18" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
        <line x1="16" y1="26" x2="38" y2="26" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
        <line x1="16" y1="34" x2="30" y2="34" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
      </svg>

      {/* ── Main content ── */}

      <div className={s.content}>

        {/* Header */}
        <header className={s.header}>
          <h1 className={s.title}>לוח הכיתה שלנו</h1>
          <p className={s.subtitle}>כיתה א׳1</p>
          <span className={s.dateBadge}>
            <CalendarIcon />
            {data.dateLabel}
          </span>
        </header>

        {/* Chalkboards */}
        <div className={s.boards}>

          {/* What we learned */}
          <div className={s.board}>
            <div className={s.boardTitle}>
              <BookIcon />
              מה למדנו היום?
            </div>
            <SubjectList items={data.learned} emptyMsg="אין נתונים ללמידה" />
          </div>

          {/* Homework */}
          <div className={s.board}>
            <div className={s.boardTitle}>
              <PencilIcon />
              שיעורי הבית
            </div>
            <SubjectList
              items={data.homework}
              emptyMsg="אין שיעורי בית היום 🎉"
            />
            {data.homework.length > 0 && (
              <div className={s.successBox}>
                <div className={s.successInner}>
                  <Star />
                  <p className={s.successText}>בהצלחה לכולם!</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Spacer for chalk ledge */}
        <div className={s.ledgeSpacer} />

        {/* Reminder */}
        {data.reminder && (
          <div className={s.reminder}>
            <PinIcon />
            {data.reminder}
          </div>
        )}

      </div>
    </main>
  );
}
