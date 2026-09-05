import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./styles.css";

export const metadata: Metadata = {
  title: "سامانه تحلیل معاملاتی",
  description: "رابط محلی و ایمن تحلیل معاملاتی",
  applicationName: "سامانه تحلیل معاملاتی",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b1020",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html dir="rtl" lang="fa">
      <body>{children}</body>
    </html>
  );
}
