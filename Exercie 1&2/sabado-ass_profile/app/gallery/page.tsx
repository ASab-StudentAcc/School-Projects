import PageNavigation from "../components/PageNavigation";

const interests = [
  {
    name: "Design",
    description: "I like how colors, layouts, and small details can make something clear and enjoyable to use.",
  },
  {
    name: "Music",
    description: "I enjoy listening to songs for different moods and noticing how differing lyrics shift moods.",
  },
  {
    name: "Technology",
    description: "I like learning how apps and websites work, and exploring tools that can solve everyday problems.",
  },
  {
    name: "Gaming",
    description: "I enjoy solving challenges, exploring imaginative worlds, and experiencing stories through games.",
  },
  {
    name: "Books",
    description: "I like discovering new ideas, perspectives, and stories through reading.",
  },
  {
    name: "New ideas",
    description: "I enjoy brainstorming and connecting different thoughts into something I can try or create.",
  },
];

export default function GalleryPage() {
  return (
    <main className="content">
      <p className="eyebrow">Things I enjoy</p>
      <h1>Gallery</h1>
      <p className="intro">A collection of a few things that inspire me.</p>
      <ul className="interest-grid">
        {interests.map((interest) => (
          <li key={interest.name}>
            <details>
              <summary>{interest.name}</summary>
              <p>{interest.description}</p>
            </details>
          </li>
        ))}
      </ul>
      <PageNavigation
        previous={{ href: "/about", label: "About" }}
        next={{ href: "/", label: "Home" }}
      />
    </main>
  );
}