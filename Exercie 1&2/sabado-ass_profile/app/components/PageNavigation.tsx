import Link from "next/link";

type PageNavigationProps = {
  previous: { href: string; label: string };
  next: { href: string; label: string };
};

export default function PageNavigation({ previous, next }: PageNavigationProps) {
  return (
    <nav className="page-navigation" aria-label="Page navigation">
      <Link href={previous.href}>Previous: {previous.label}</Link>
      <Link href="/">Home</Link>
      <Link href={next.href}>Next: {next.label}</Link>
    </nav>
  );
}