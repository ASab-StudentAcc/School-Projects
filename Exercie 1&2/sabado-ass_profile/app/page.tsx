import Link from "next/link";

export default function Home() {
  return (
    <main className="content">
      <p className="eyebrow">Student portfolio</p>
      <h1>Hi, I&apos;m Andrei Mickhail.</h1>
      <p className="intro">Welcome to my website. I&apos;m learning about design and web development, and this is a place to share a little about me and the work I&apos;ve done.</p>
      <p>Use the pages below to learn more.</p>
      <div className="home-links">
        <Link href="/portfolio">View my portfolio</Link>
        <Link href="/about">About me</Link>
        <Link href="/gallery">Visit the gallery</Link>
      </div>
    </main>
  );
}