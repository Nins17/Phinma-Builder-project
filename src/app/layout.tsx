import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITE300 Retake Checker",
  description: "Check your P2 wrap-up quiz and check-in retakes",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
