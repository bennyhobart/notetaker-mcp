import React, { useState, useEffect } from "react";
import { Note, NoteWithPreview } from "../types";
import MarkdownEditor from "./MarkdownEditor";

const NotesView: React.FC = () => {
  const [notes, setNotes] = useState<NoteWithPreview[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notes");
      const result = await response.json();
      if (result.success) {
        const processedNotes = result.data.map((note: any) => {
          const preview =
            note.content.length > 100 ? note.content.substring(0, 100) + "..." : note.content;

          return {
            title: note.title,
            preview: preview,
          };
        });
        setNotes(processedNotes);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNoteContent = async (title: string) => {
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(title)}`);
      const result = await response.json();
      if (result.success) {
        setSelectedNote(result.data);
      }
    } catch (error) {
      console.error("Error loading note content:", error);
    }
  };

  const createNewNote = async () => {
    const title = prompt("Enter note title:");
    if (!title) return;

    const content = `# ${title}

Start writing your note here...`;

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      });
      const result = await response.json();
      if (result.success) {
        loadNotes();
        loadNoteContent(title);
      } else {
        alert("Failed to create note: " + result.error);
      }
    } catch (error) {
      console.error("Error creating note:", error);
      alert("Failed to create note: " + (error as Error).message);
    }
  };

  const saveNote = async (title: string, content: string) => {
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(title)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      const result = await response.json();
      if (result.success) {
        loadNotes();
        loadNoteContent(title);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error saving note:", error);
      throw error;
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center text-gray-500 py-10">Loading notes...</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={createNewNote}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              title="Create new note"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {notes.length === 0 ? "No notes yet" : "No matching notes"}
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.title}
                onClick={() => loadNoteContent(note.title)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedNote?.title === note.title
                    ? "bg-blue-50 border-l-4 border-l-blue-500"
                    : ""
                }`}
              >
                <div className="font-medium text-gray-900 mb-1 text-sm">{note.title}</div>
                <div className="text-xs text-gray-600 line-clamp-2">{note.preview}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main content */}
      {selectedNote != null ? (
        <MarkdownEditor
          key={selectedNote.title}
          note={selectedNote}
          onSave={saveNote}
          onClose={() => setSelectedNote(null)}
        />
      ) : null}
    </div>
  );
};

export default NotesView;
