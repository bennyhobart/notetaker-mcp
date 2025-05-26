import React, { useState, useEffect, useCallback } from "react";
import { throttle } from "lodash-es";
import { Note, NoteWithPreview } from "../types";
import MarkdownEditor from "./MarkdownEditor";
import LinksPanel from "./LinksPanel";

const NotesView: React.FC = (): JSX.Element => {
  const [notes, setNotes] = useState<NoteWithPreview[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NoteWithPreview[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  const searchNotes = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    try {
      const response = await fetch(`/api/notes/search?q=${encodeURIComponent(query)}`);
      const result = await response.json();
      if (result.success) {
        const processedNotes = result.data.map((note: Note) => {
          const preview =
            note.content.length > 100 ? note.content.substring(0, 100) + "..." : note.content;

          return {
            title: note.title,
            preview: preview,
          };
        });
        setSearchResults(processedNotes);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching notes:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Create throttled search function
  const throttledSearch = useCallback(
    throttle((query: string) => {
      searchNotes(query);
    }, 300),
    []
  );

  // Throttled search effect
  useEffect(() => {
    if (searchQuery.trim()) {
      setSearching(true);
      throttledSearch(searchQuery);
    } else {
      setSearching(false);
      setSearchResults([]);
      throttledSearch.cancel(); // Cancel any pending throttled calls
    }
  }, [searchQuery, throttledSearch]);

  const loadNotes = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch("/api/notes");
      const result = await response.json();
      if (result.success) {
        const processedNotes = result.data.map((note: Note) => {
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

  const loadNoteContent = async (title: string): Promise<void> => {
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(title)}`);
      const result = await response.json();
      if (result.success) {
        setSelectedNote(result.data);
      } else if (response.status === 404) {
        // Note doesn't exist - create a draft with the requested title
        const draftNote: Note = {
          title: title,
          content: `# ${title}\n\nStart writing your note here...`,
          isDraft: true,
        };
        setSelectedNote(draftNote);
      }
    } catch (error) {
      console.error("Error loading note content:", error);
    }
  };

  const createNewNote = (): void => {
    const draftNote: Note = {
      title: "Untitled Note",
      content: "# Untitled Note\n\nStart writing your note here...",
      isDraft: true,
    };
    setSelectedNote(draftNote);
  };

  const saveNote = async (title: string, content: string): Promise<void> => {
    try {
      let response;

      if (selectedNote?.isDraft) {
        // Creating a new note
        response = await fetch("/api/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, content }),
        });
      } else {
        // Updating existing note
        response = await fetch(`/api/notes/${encodeURIComponent(title)}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        });
      }

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

  const deleteNote = async (title: string): Promise<void> => {
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(title)}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        setSelectedNote(null);
        loadNotes();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  };

  // Use search results if there's a search query, otherwise show all notes
  const displayedNotes = searchQuery.trim() ? searchResults : notes;

  if (loading) {
    return <div className="text-center text-gray-500 py-10">Loading notes...</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
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
          {displayedNotes.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchQuery.trim()
                ? "No matching notes found"
                : notes.length === 0
                  ? "No notes yet"
                  : "No matching notes"}
            </div>
          ) : (
            displayedNotes.map((note) => (
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

        {/* Links Panel */}
        {selectedNote && (
          <LinksPanel noteTitle={selectedNote.title} onNavigateToNote={loadNoteContent} />
        )}
      </div>

      {/* Main content */}
      {selectedNote != null ? (
        <MarkdownEditor
          key={selectedNote.title}
          note={selectedNote}
          onSave={saveNote}
          onClose={() => setSelectedNote(null)}
          onNavigateToNote={loadNoteContent}
          onDelete={deleteNote}
        />
      ) : null}
    </div>
  );
};

export default NotesView;
