import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Papertrail Notes",
  description: "A simple place to collect your thoughts."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
