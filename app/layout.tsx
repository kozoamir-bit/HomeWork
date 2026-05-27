import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "לוח הכיתה – א׳1",
  description: "מה למדנו היום ומה שיעורי הבית",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
