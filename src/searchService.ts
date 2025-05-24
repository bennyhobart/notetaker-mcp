import MiniSearch from "minisearch";
import { Note } from "./noteService.js";

class SearchService {
  private miniSearch: MiniSearch<Note & { id: string }>;
  private isInitialized = false;

  constructor() {
    this.miniSearch = new MiniSearch({
      fields: ["title", "content"],
      storeFields: ["title", "content"],
      searchOptions: {
        boost: { title: 2 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
  }

  /**
   * Initialize the search index with all existing notes
   */
  async initialize(notes: Note[]): Promise<void> {
    this.miniSearch.removeAll();
    const indexedNotes = notes.map((note) => ({ ...note, id: note.title }));
    this.miniSearch.addAll(indexedNotes);
    this.isInitialized = true;
  }

  /**
   * Add a note to the search index
   */
  addNote(note: Note): void {
    if (!this.isInitialized) return;

    // Remove existing note if it exists (for updates)
    if (this.miniSearch.has(note.title)) {
      this.miniSearch.discard(note.title);
    }

    this.miniSearch.add({ ...note, id: note.title });
  }

  /**
   * Remove a note from the search index
   */
  removeNote(noteTitle: string): void {
    if (!this.isInitialized) return;

    if (this.miniSearch.has(noteTitle)) {
      this.miniSearch.discard(noteTitle);
    }
  }

  /**
   * Update a note in the search index
   */
  updateNote(note: Note): void {
    if (!this.isInitialized) return;

    this.removeNote(note.title);
    this.addNote(note);
  }

  /**
   * Search notes
   */
  search(query: string): Note[] {
    if (!this.isInitialized || !query.trim()) {
      return [];
    }

    return this.miniSearch.search(query).map((result) => ({
      title: result.title,
      content: result.content,
    }));
  }

  /**
   * Check if search service is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const searchService = new SearchService();
