import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RealOrRender | Pre-Share Verification",
  description: "Verify article credibility before sharing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
