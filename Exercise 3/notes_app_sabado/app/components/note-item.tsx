export type Note = {
  id: string;
  title: string;
  description: string;
};

type NoteItemProps = {
  note: Note;
  index: number;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onRestore?: (noteId: string) => void;
  onDiscard?: (noteId: string) => void;
};

export default function NoteItem({
  note,
  index,
  onEdit,
  onDelete,
  onRestore,
  onDiscard,
}: NoteItemProps) {
  return (
    <article className="note-card">
      <div className="note-card-topline">
        <span className="note-number">{String(index + 1).padStart(2, "0")}</span>
        <div className="note-actions">
          {onRestore ? (
            <>
              <button
                className="note-action"
                type="button"
                onClick={() => onEdit(note)}
                aria-label={`Edit ${note.title}`}
              >
                Edit
              </button>
              <button
                className="note-action restore-action"
                type="button"
                onClick={() => onRestore(note.id)}
                aria-label={`Restore ${note.title}`}
              >
                Restore
              </button>
              {onDiscard && (
                <button
                  className="note-action delete-action"
                  type="button"
                  onClick={() => onDiscard(note.id)}
                  aria-label={`Delete ${note.title} permanently`}
                >
                  Delete permanently
                </button>
              )}
            </>
          ) : (
            <>
              <button
                className="note-action"
                type="button"
                onClick={() => onEdit(note)}
                aria-label={`Edit ${note.title}`}
              >
                Edit
              </button>
              <button
                className="note-action delete-action"
                type="button"
                onClick={() => onDelete(note.id)}
                aria-label={`Delete ${note.title}`}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      <h3 className="note-title">{note.title}</h3>
      <p className="note-description">{note.description}</p>
    </article>
  );
}