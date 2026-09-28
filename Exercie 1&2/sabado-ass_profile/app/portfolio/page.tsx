import PageNavigation from "../components/PageNavigation";

const projects = [
  { name: "Deep Dark", description: "A simple exploration game I created, with a simple user interface." },
  { name: "Portfolio Website", description: "This website, built to introduce me and share my projects." },
  { name: "PC Parts Company Website", description: "A group project website for a small company that sells computer parts." },
];

export default function PortfolioPage() {
  return (
    <main className="content">
      <p className="eyebrow">My work</p>
      <h1>Portfolio</h1>
      <p className="intro">Here are a few examples of the work I&apos;m learning to make.</p>
      <ul className="simple-list">
        {projects.map((project) => (
          <li key={project.name}>
            <h2>{project.name}</h2>
            <p>{project.description}</p>
          </li>
        ))}
      </ul>
      <PageNavigation
        previous={{ href: "/", label: "Home" }}
        next={{ href: "/about", label: "About" }}
      />
    </main>
  );
}