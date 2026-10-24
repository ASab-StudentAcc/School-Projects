import { redirect } from "next/navigation";
import { getSessionEmail } from "../../lib/auth";
import NotesClient from "./notes-client";

export default async function NotesPage() {
  const email = await getSessionEmail();
  if (!email) {
    redirect("/");
  }

  return <NotesClient key={email} email={email} />;
}
