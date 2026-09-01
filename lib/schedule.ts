export type ScheduleItem = { subject: string; materials: string };

// Weekly schedule for כיתה ב'1 — keyed by JS day-of-week (0=Sun … 6=Sat)
export const WEEKLY_SCHEDULE: Record<number, ScheduleItem[]> = {
  0: [ // יום ראשון
    { subject: "תורה",        materials: "צהר לבראשית" },
    { subject: "מדעים",       materials: "חוברת" },
    { subject: "שפה",         materials: "חוברת בסוד הקריאה" },
    { subject: "חשבון",       materials: "חוברת שבילים חדשים" },
    { subject: "כשורי חיים",  materials: "" },
  ],
  1: [ // יום שני
    { subject: "תורה",        materials: "צהר לבראשית" },
    { subject: "שפה",         materials: "חוברת בסוד הקריאה" },
    { subject: "חשבון",       materials: "חוברת שבילים חדשים" },
    { subject: "משנה",        materials: "תיקיית שקף ו-2 ניילוניות" },
    { subject: "חינוך גופני", materials: "נעלי ספורט + מכנסיים" },
  ],
  2: [ // יום שלישי
    { subject: "תורה",        materials: "צהר לבראשית" },
    { subject: "שפה",         materials: "חוברת בסוד הקריאה" },
    { subject: "חשבון",       materials: "חוברת שבילים חדשים" },
    { subject: "אנגלית",      materials: "ספר + חוברת ומחברת" },
    { subject: "אומנות",      materials: "צבעי פנדה + בלוק ציור ועפרונות רישום" },
    { subject: "שחמט",        materials: "" },
  ],
  3: [ // יום רביעי
    { subject: "שפה",         materials: "חוברת בסוד הקריאה" },
    { subject: "חשבון",       materials: "חוברת שבילים חדשים" },
    { subject: "אנגלית",      materials: "ספר + חוברת ומחברת" },
    { subject: "הלכה / תורה", materials: "חוברת הלכה" },
  ],
  4: [ // יום חמישי
    { subject: "חינוך גופני",   materials: "נעלי ספורט + מכנסיים" },
    { subject: "חקלאות",        materials: "" },
    { subject: "העשרה / ספריה", materials: "" },
    { subject: "מפתח הלב",      materials: "משחק חשיבה" },
    { subject: "קסמים",         materials: "מחברת קסמים" },
    { subject: "מדעים",         materials: "חוברת" },
  ],
  5: [ // יום שישי
    { subject: "פ. שבוע",   materials: "" },
    { subject: "תורה",       materials: "צהר לבראשית" },
    { subject: "שפה",        materials: "חוברת בסוד הקריאה" },
    { subject: "חשבון",      materials: "חוברת שבילים חדשים" },
  ],
};

// Always in the bag every day
export const DAILY_ALWAYS = [
  "קלמר מאובזר",
  'תיקיית ד"ש מהבית',
  "מחברות: עברית, חשבון והכתבות",
  "ספר קריאה",
  "בקבוק מים",
];
