import PageNavigation from "../components/PageNavigation";

export default function AboutPage() {
  return (
    <main className="content">
      <p className="eyebrow">A little about me</p>
      <h1>About</h1>
      <p className="intro">I&apos;m Andrei Mickhail, though most people call me Mico. I&apos;m a student interested in design, technology, and learning how websites are made.</p>
      <p>I enjoy trying new things, working through creative challenges, and building skills one project at a time. This website is part of that journey.</p>
      <h2>What I&apos;m learning</h2>
      <ul className="plain-list">
        <li>Building websites with HTML, CSS, and Java</li>
        <li>Making clear and useful designs</li>
        <li>Turning ideas into finished projects</li>
      </ul>
      <PageNavigation
        previous={{ href: "/portfolio", label: "Portfolio" }}
        next={{ href: "/gallery", label: "Gallery" }}
      />
    </main>
  );
}