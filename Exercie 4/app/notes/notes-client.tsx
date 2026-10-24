"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
};

type NoteConflict = "title" | "content" | null;
type NoteView = "active" | "trash";

function readNotes(value: unknown): Note[] {
  if (!Array.isArray(value)) {
    throw new Error("Saved notes have an invalid format.");
  }

  return value.map((entry) => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      !("id" in entry) ||
      !("title" in entry) ||
      !("body" in entry) ||
      !("createdAt" in entry) ||
      typeof entry.id !== "string" ||
      typeof entry.title !== "string" ||
      typeof entry.body !== "string" ||
      typeof entry.createdAt !== "string"
    ) {
      throw new Error("A saved note has invalid fields.");
    }

    return {
      id: entry.id,
      title: entry.title,
      body: entry.body,
      createdAt: entry.createdAt,
      ...("updatedAt" in entry && typeof entry.updatedAt === "string"
        ? { updatedAt: entry.updatedAt }
        : {}),
      ...("deletedAt" in entry && typeof entry.deletedAt === "string"
        ? { deletedAt: entry.deletedAt }
        : {})
    };
  });
}

function normalizeForComparison(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function getNoteConflict(
  notes: Note[],
  candidate: Pick<Note, "title" | "body">,
  excludedId?: string
): NoteConflict {
  const otherActiveNotes = notes.filter(
    (note) => !note.deletedAt && note.id !== excludedId
  );
  const title = normalizeForComparison(candidate.title);
  if (otherActiveNotes.some((note) => normalizeForComparison(note.title) === title)) {
    return "title";
  }

  const body = normalizeForComparison(candidate.body);
  if (
    body &&
    otherActiveNotes.some((note) => normalizeForComparison(note.body) === body)
  ) {
    return "content";
  }

  return null;
}

export default function NotesClient({ email }: { email: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<NoteView>("active");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [storageWritable, setStorageWritable] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const storageKey = `papertrail-notes:${email}`;

  useEffect(() => {
    try {
      const savedNotes = window.localStorage.getItem(storageKey);
      setNotes(savedNotes ? readNotes(JSON.parse(savedNotes)) : []);
      setStorageWritable(true);
    } catch (error) {
      console.error("Unable to load saved notes.", error);
      setStorageMessage("Saved notes could not be loaded. They have not been overwritten.");
    } finally {
      setReady(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!ready || !storageWritable) return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(notes));
      setStorageMessage("");
    } catch (error) {
      console.error("Unable to save notes.", error);
      setStorageWritable(false);
      setStorageMessage("Notes could not be saved in this browser.");
    }
  }, [notes, ready, storageKey, storageWritable]);

  function resetComposer() {
    setTitle("");
    setBody("");
    setEditingId(null);
    setMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle) {
      setMessage("Add a title before saving your note.");
      return;
    }

    const conflict = getNoteConflict(
      notes,
      { title: trimmedTitle, body: trimmedBody },
      editingId ?? undefined
    );
    if (conflict === "title") {
      setMessage("A note with this title already exists. Try a different title.");
      return;
    }
    if (conflict === "content") {
      setMessage("Another note already has this text. Check for a duplicate before saving.");
      return;
    }

    if (editingId) {
      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === editingId
            ? {
                ...note,
                title: trimmedTitle,
                body: trimmedBody,
                updatedAt: new Date().toISOString()
              }
            : note
        )
      );
    } else {
      setNotes((currentNotes) => [
        {
          id: crypto.randomUUID(),
          title: trimmedTitle,
          body: trimmedBody,
          createdAt: new Date().toISOString()
        },
        ...currentNotes
      ]);
    }

    resetComposer();
  }

  function startEditing(note: Note) {
    setTitle(note.title);
    setBody(note.body);
    setEditingId(note.id);
    setActiveView("active");
    setMessage("");
    document.getElementById("note-title")?.focus();
  }

  function moveToTrash(id: string) {
    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === id ? { ...note, deletedAt: new Date().toISOString() } : note
      )
    );
    if (editingId === id) resetComposer();
  }

  function restoreNote(id: string) {
    const noteToRestore = notes.find((note) => note.id === id);
    if (!noteToRestore) return;

    const conflict = getNoteConflict(notes, noteToRestore);
    if (conflict === "title") {
      setMessage(`“${noteToRestore.title}” cannot be restored because an active note already uses that title.`);
      return;
    }
    if (conflict === "content") {
      setMessage(`“${noteToRestore.title}” cannot be restored because another active note has the same text.`);
      return;
    }

    setMessage("");
    setNotes((currentNotes) =>
      currentNotes.map((note) => {
        if (note.id !== id) return note;
        const { deletedAt: _deletedAt, ...restoredNote } = note;
        return restoredNote;
      })
    );
  }

  function permanentlyDeleteNote(id: string) {
    if (!window.confirm("Delete this note forever? This cannot be undone.")) {
      return;
    }
    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== id));
    setMessage("");
  }

  async function handleLogout() {
    setLogoutError("");
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      if (!response.ok) {
        setLogoutError("Unable to sign out. Please try again.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Unable to reach the sign-out service.", error);
      setLogoutError("Unable to reach the sign-out service. Check your connection and try again.");
    }
  }

  const activeNotes = notes.filter((note) => !note.deletedAt);
  const trashedNotes = notes.filter((note) => Boolean(note.deletedAt));
  const visibleNotes = activeView === "active" ? activeNotes : trashedNotes;

  return (
    <main className="notes-page">
      <header className="notes-header">
        <a className="wordmark" href="/notes" aria-label="Papertrail Notes home">
          <span className="brand-mark small" aria-hidden="true">p.</span>
          papertrail
        </a>
        <button className="logout-button" onClick={handleLogout} type="button">
          Log out <span aria-hidden="true">↗</span>
        </button>
      </header>
      {logoutError && <p className="form-message is-visible" role="alert">{logoutError}</p>}

      <section className="notes-content">
        <div className="notes-intro">
          <p className="eyebrow">YOUR PERSONAL NOTEBOOK</p>
          <h1>Good thoughts, <em>kept.</em></h1>
          <p>Capture a thought before it wanders off.</p>
        </div>

        <form className="note-composer" onSubmit={handleSubmit}>
          <div className="composer-heading">
            <h2>{editingId ? "Edit note" : "Write a note"}</h2>
            {editingId && (
              <button className="text-button" onClick={resetComposer} type="button">
                Cancel edit
              </button>
            )}
          </div>
          <label className="visually-hidden" htmlFor="note-title">Note title</label>
          <input
            id="note-title"
            maxLength={100}
            onChange={(event) => {
              setTitle(event.target.value);
              setMessage("");
            }}
            placeholder="Give this note a title..."
            value={title}
          />
          <label className="visually-hidden" htmlFor="note-body">Note text</label>
          <textarea
            id="note-body"
            onChange={(event) => {
              setBody(event.target.value);
              setMessage("");
            }}
            placeholder="Start writing..."
            rows={4}
            value={body}
          />
          <div className="composer-footer">
            <span>Titles and note text are checked for duplicates.</span>
            <button className="primary-button save-button" disabled={!ready} type="submit">
              {editingId ? "Save changes" : "Save note"} <span aria-hidden="true">＋</span>
            </button>
          </div>
          {message && <p className="note-message" role="alert">{message}</p>}
          {storageMessage && <p className="note-message" role="alert">{storageMessage}</p>}
        </form>

        <section className="saved-notes" aria-labelledby="saved-notes-title">
          <div className="notes-toolbar">
            <div className="section-heading">
              <h2 id="saved-notes-title">
                {activeView === "active" ? "Your notes" : "Recently deleted"}
              </h2>
              <span className="note-count">
                {activeView === "active" ? activeNotes.length : trashedNotes.length}
              </span>
            </div>
            <div className="notes-tabs" aria-label="Note folders">
              <button
                aria-pressed={activeView === "active"}
                className={activeView === "active" ? "notes-tab is-active" : "notes-tab"}
                onClick={() => {
                  setActiveView("active");
                  setMessage("");
                }}
                type="button"
              >
                Notes
              </button>
              <button
                aria-pressed={activeView === "trash"}
                className={activeView === "trash" ? "notes-tab is-active" : "notes-tab"}
                onClick={() => {
                  setActiveView("trash");
                  setMessage("");
                }}
                type="button"
              >
                Trash ({trashedNotes.length})
              </button>
            </div>
          </div>

          {visibleNotes.length === 0 ? (
            <div className="empty-state">
              <span aria-hidden="true">{activeView === "active" ? "✳" : "⌫"}</span>
              <p>{activeView === "active" ? "Your page is still blank." : "Your trash is empty."}</p>
              <small>
                {activeView === "active"
                  ? "Save your first note above and it’ll be waiting here."
                  : "Deleted notes will stay here until you restore or remove them."}
              </small>
            </div>
          ) : (
            <div className="note-grid">
              {visibleNotes.map((note) => (
                <article className="note-card" key={note.id}>
                  <div className="note-card-top">
                    <time dateTime={note.createdAt}>
                      {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      }).format(new Date(note.createdAt))}
                    </time>
                    {note.updatedAt && <span className="edited-label">Edited</span>}
                    <div className="note-actions">
                      {activeView === "active" ? (
                        <>
                          <button
                            aria-label={`Edit ${note.title}`}
                            className="text-button"
                            onClick={() => startEditing(note)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            aria-label={`Move ${note.title} to trash`}
                            className="delete-button"
                            onClick={() => moveToTrash(note.id)}
                            type="button"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="text-button"
                            onClick={() => restoreNote(note.id)}
                            type="button"
                          >
                            Restore
                          </button>
                          <button
                            aria-label={`Permanently delete ${note.title}`}
                            className="text-button danger-button"
                            onClick={() => permanentlyDeleteNote(note.id)}
                            type="button"
                          >
                            Delete forever
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <h3>{note.title}</h3>
                  {note.body && <p>{note.body}</p>}
                  {note.deletedAt && (
                    <small className="deleted-date">
                      Deleted {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      }).format(new Date(note.deletedAt))}
                    </small>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
      <footer className="notes-footer">A quiet place to think.</footer>
    </main>
  );
}
