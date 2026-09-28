"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pages = [
  { href: "/", label: "Home" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <nav className="navigation" aria-label="Main navigation">
        {pages.map((page) => (
          <Link
            className={pathname === page.href ? "active" : ""}
            href={page.href}
            key={page.href}
            aria-current={pathname === page.href ? "page" : undefined}
          >
            {page.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}