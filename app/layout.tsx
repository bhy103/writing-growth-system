import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family AI Coach",
  description: "Personal learning coach for writing, vocabulary, and math",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
