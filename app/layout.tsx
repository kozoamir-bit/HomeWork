import type { Metadata } from "next";
import "./globals.css";
import AutoRefresh from "./components/AutoRefresh";
import ShareButton from "./components/ShareButton";

export const metadata: Metadata = {
  title: "לוח הכיתה – ב׳1",
  description: "מה למדנו היום ומה שיעורי הבית",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <AutoRefresh />
        {children}
        <ShareButton />
      </body>
    </html>
  );
}
