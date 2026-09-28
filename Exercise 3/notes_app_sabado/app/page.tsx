"use client";

import { useEffect, useState, type FormEvent } from "react";
import NoteItem, { type Note } from "./components/note-item";

const STORAGE_KEY = "little-notes";
const DELETED_STORAGE_KEY = "personal-notes-recently-deleted";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDeletedId, setEditingDeletedId] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [duplicateTitle, setDuplicateTitle] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const savedNotes = window.localStorage.getItem(STORAGE_KEY);
        if (savedNotes) {
          const parsedNotes: unknown = JSON.parse(savedNotes);
          if (Array.isArray(parsedNotes)) setNotes(parsedNotes as Note[]);
        }
        const savedDeletedNotes = window.localStorage.getItem(DELETED_STORAGE_KEY);
        if (savedDeletedNotes) {
          const parsedDeletedNotes: unknown = JSON.parse(savedDeletedNotes);
          if (Array.isArray(parsedDeletedNotes)) {
            setDeletedNotes(parsedDeletedNotes as Note[]);
          }
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(DELETED_STORAGE_KEY);
      } finally {
        setHasLoaded(true);
      }

    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      window.localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deletedNotes));
    }
  }, [deletedNotes, hasLoaded, notes]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const normalizedTitle = title.trim().toLocaleLowerCase();
      setDuplicateTitle(
        !editingDeletedId &&
          normalizedTitle.length > 0 &&
          notes.some(
            (note) =>
              note.id !== editingId &&
              note.title.trim().toLocaleLowerCase() === normalizedTitle,
          ),
      );
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [editingDeletedId, editingId, notes, title]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setEditingId(null);
    setEditingDeletedId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle || !cleanDescription) return;

    const alreadyExists =
      !editingDeletedId &&
      notes.some(
        (note) =>
          note.id !== editingId &&
          note.title.trim().toLocaleLowerCase() === cleanTitle.toLocaleLowerCase(),
      );

    if (alreadyExists) {
      setDuplicateTitle(true);
      return;
    }

    if (editingDeletedId) {
      setDeletedNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === editingDeletedId
            ? { ...note, title: cleanTitle, description: cleanDescription }
            : note,
        ),
      );
    } else if (editingId) {
      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === editingId
            ? { ...note, title: cleanTitle, description: cleanDescription }
            : note,
        ),
      );
    } else {
      setNotes((currentNotes) => [
        { id: crypto.randomUUID(), title: cleanTitle, description: cleanDescription },
        ...currentNotes,
      ]);
    }

    resetForm();
  }

  function startEditing(note: Note) {
    setTitle(note.title);
    setDescription(note.description);
    setEditingId(note.id);
    setEditingDeletedId(null);
  }

  function startEditingDeleted(note: Note) {
    setTitle(note.title);
    setDescription(note.description);
    setEditingId(null);
    setEditingDeletedId(note.id);
    setRestoreMessage("");
  }

  function deleteNote(noteId: string) {
    const deletedNote = notes.find((note) => note.id === noteId);
    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId));
    if (deletedNote) {
      setDeletedNotes((currentNotes) => [
        deletedNote,
        ...currentNotes.filter((note) => note.id !== noteId),
      ]);
    }
    if (editingId === noteId) resetForm();
  }

  function restoreNote(noteId: string) {
    const deletedNote = deletedNotes.find((note) => note.id === noteId);
    if (!deletedNote) return;

    const hasTitleConflict = notes.some(
      (note) => note.title.trim().toLocaleLowerCase() === deletedNote.title.trim().toLocaleLowerCase(),
    );
    if (hasTitleConflict) {
      setRestoreMessage("A note with this title already exists. Rename it before restoring this note.");
      return;
    }

    setNotes((currentNotes) => [deletedNote, ...currentNotes]);
    setDeletedNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId));
    setRestoreMessage("");
    if (editingDeletedId === noteId) resetForm();
  }

  function permanentlyDeleteNote(noteId: string) {
    setDeletedNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId));
    setRestoreMessage("");
    if (editingDeletedId === noteId) resetForm();
  }

  return (
    <main className="notes-app">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Personal Notes home">
          <span className="brand-mark" aria-hidden="true">P.</span>
          <span>Personal Notes</span>
        </a>
        <span className="topbar-note">A little space for your thoughts</span>
      </header>

      <section className="workspace" id="home">
        <svg className="top-circles" viewBox="0 0 160 160" aria-hidden="true">
          <path className="top-circle-outer" d="M 160 0 L 8 0 A 152 152 0 0 0 160 152 Z" />
          <path className="top-circle-middle" d="M 160 0 L 56 0 A 104 104 0 0 0 160 104 Z" />
          <path className="top-circle-inner" d="M 160 0 L 104 0 A 56 56 0 0 0 160 56 Z" />
        </svg>
        <div className="intro">
          <p className="eyebrow">YOUR PERSONAL NOTEBOOK</p>
          <h1>
            <span className="intro-note-count">{notes.length}</span>
            <br />
            {notes.length === 1 ? "note made." : "notes made."}
          </h1>
          <p className="intro-copy">Your thoughts, all in one place.</p>
        </div>

        <div className="workspace-grid">
          <section className="compose-panel" aria-labelledby="compose-heading">
            <div className="section-heading">
              <span className="step-number">01</span>
              <h2 id="compose-heading">
                {editingId || editingDeletedId ? "Edit note" : "New note"}
              </h2>
            </div>

            <form className="note-form" onSubmit={handleSubmit}>
              <label htmlFor="note-title">Title</label>
              <input
                id="note-title"
                name="title"
                placeholder="Give it a name"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={80}
                required
              />
              {duplicateTitle && (
                <p className="field-message" role="status">
                  A note with this title already exists.
                </p>
              )}

              <label htmlFor="note-description">Description</label>
              <textarea
                id="note-description"
                name="description"
                placeholder="What's on your mind?"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
                    return;
                  }
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }}
                rows={6}
                maxLength={1000}
                required
              />

              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={duplicateTitle}>
                  {editingId || editingDeletedId ? "Save changes" : "Add note"}
                  <span aria-hidden="true">↗</span>
                </button>
                {(editingId || editingDeletedId) && (
                  <button className="text-button" type="button" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
            <p className="saved-locally"><span aria-hidden="true">●</span> Saved on this device</p>
          </section>

          <section className="notes-panel" aria-labelledby="notes-heading">
            <div className="notes-heading-row">
              <div className="section-heading">
                <span className="step-number">02</span>
                <h2 id="notes-heading">Your notes</h2>
              </div>
              <span className="note-count" aria-label={`${notes.length} ${notes.length === 1 ? "note" : "notes"}`}>
                {String(notes.length).padStart(2, "0")}
              </span>
            </div>

            {notes.length > 0 ? (
              <div className="note-list">
                {notes.map((note, index) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    index={index}
                    onEdit={startEditing}
                    onDelete={deleteNote}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-mark" aria-hidden="true">✳</span>
                <h3>No notes just yet</h3>
                <p>Your next good thought can start here.</p>
              </div>
            )}

            <section className="recently-deleted" aria-labelledby="deleted-heading">
              <div className="notes-heading-row">
                <div className="section-heading">
                  <span className="step-number">03</span>
                  <h2 id="deleted-heading">Recently deleted</h2>
                </div>
                <span className="note-count" aria-label={`${deletedNotes.length} deleted notes`}>
                  {String(deletedNotes.length).padStart(2, "0")}
                </span>
              </div>
              {restoreMessage && <p className="field-message" role="status">{restoreMessage}</p>}
              {deletedNotes.length > 0 ? (
                <div className="note-list">
                  {deletedNotes.map((note, index) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      index={index}
                      onEdit={startEditingDeleted}
                      onDelete={deleteNote}
                      onRestore={restoreNote}
                      onDiscard={permanentlyDeleteNote}
                    />
                  ))}
                </div>
              ) : (
                <p className="deleted-empty">Deleted notes will be kept here for you to restore.</p>
              )}
            </section>
          </section>
        </div>
      </section>

      <footer className="footer-note">Small thoughts count, too.</footer>
    </main>
  );
}
