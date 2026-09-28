import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "Andrei Mickhail | Student Portfolio",
  description: "A student portfolio with projects, information, and interests.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <footer className="site-footer">Student portfolio</footer>
      </body>
    </html>
  );
}
