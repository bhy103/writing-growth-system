import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Writing Growth System",
  description: "English writing improvement system for children",
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
